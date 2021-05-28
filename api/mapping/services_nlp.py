import json
import logging
import os
import time
from azure.storage.queue import QueueClient

import requests
from coconnect.tools.omop_db_inspect import OMOPDetails
from data.models import Concept, ConceptRelationship
from django.db.models import Q

from .models import (ScanReport, ScanReportAssertion, ScanReportConcept,
                     ScanReportField, ScanReportValue)
from .services import find_standard_concept, get_concept_from_concept_code

# Get an instance of a logger
logger = logging.getLogger(__name__)

def get_data_from_nlp(url, headers, post_response_url):
    """
    This function takes a list of POST'ed URLs and returns
    a list of responses.
    """

    get_response = []
    for url in post_response_url:

        req = requests.get(url, headers=headers)
        job = req.json()

        while job["status"] != "succeeded":
            req = requests.get(url, headers=headers)
            job = req.json()
            time.sleep(3)
        else:
            get_response.append(job["results"])
            logger.info("NLP Done!")

    return get_response


def process_nlp_response(get_response):
    """
    This function takes as input an NLP GET response
    and returns a list of concept codes.

    Input: get_response - A list of GET responses
    Output: codes - A list of concept Codes

    """
    keep = ["ICD9CM", "ICD10CM", "RXNORM", "SNOMEDCT_US", "SNOMED"]
    codes = []

    for url in get_response:
        for dict_entry in url["documents"]:
            for entity in dict_entry["entities"]:
                if "links" in entity.keys():
                    for link in entity["links"]:
                        if link["dataSource"] in keep:
                            codes.append(
                                [
                                    dict_entry["id"],
                                    entity["text"],
                                    entity["category"],
                                    entity["confidenceScore"],
                                    link["dataSource"],
                                    link["id"],
                                ]
                            )

    return codes


def concept_code_to_id(codes):
    """
    This functions looks up standard and valid conceptIDs for concept codes
    Appends conceptID to item in list, returns a dictionary of data
    """
    codes_dict = []
    keys = [
        "pk",
        "nlp_entity",
        "nlp_entity_type",
        "nlp_confidence",
        "nlp_vocab",
        "nlp_code",
        "conceptid",
    ]
    for item in codes:
        try:
            x = get_concept_from_concept_code(
                concept_code=str(item[5]), vocabulary_id=str(item[4])
            )
            item.append(x[1].concept_id)
            codes_dict.append(dict(zip(keys, item)))
        except:
            logger.info("Concept Code", item[5], "not found!")

    return codes_dict


def start_nlp(search_term):

    logger.info(">>>>> Running NLP in services_nlp.py for", search_term)
    field = ScanReportField.objects.get(pk=search_term)
    scan_report_id = field.scan_report_table.scan_report.id

    # Define NLP things
    url = "https://ccnett2.cognitiveservices.azure.com/text/analytics/v3.1-preview.3/entities/health/jobs?stringIndexType=TextElements_v8"
    headers = {
        "Ocp-Apim-Subscription-Key": os.environ.get("NLP_API_KEY"),
        "Content-Type": "application/json; utf-8",
    }

    # Create empty list to later hold job URLs
    post_response_url = []

    # Checks to see if the field is 'pass_from_source'
    # If True, we pass field-level data i.e. a single string (field description)
    # If False, we pass all values associated with that field
    if field.pass_from_source:
        # We want to use the field description if available
        # However, we fall back to field name if field_description is None
        if field.description_column is None:
            document = {
                "documents": [
                    {"language": "en", "id": field.id,
                        "text": field.name.replace("_", " ")}
                ]
            }

        else:
            # Create a single dictionary item for the field description
            # Convert to JSON for NLP, POST the data to NLP API, save the job URL
            document = {
                "documents": [
                    {"language": "en", "id": field.id,
                        "text": field.description_column.replace("_", " ")}
                ]
            }

        payload = json.dumps(document)

        # Send JSON payload to nlp-processing-queue in Azure
        queue = QueueClient.from_connection_string(
            conn_str=os.environ.get("AZURE_STORAGE_CONNECTION_STRING"),
            queue_name="nlp-processing-queue"
        )
        queue.send_message(payload)
        print(queue)

        response = requests.post(url, headers=headers, data=payload)
        post_response_url.append(response.headers["operation-location"])

        # Get the data back from NLP API, convert code to conceptIDs
        get_response = get_data_from_nlp(
            url=url, headers=headers, post_response_url=post_response_url
        )
        codes = process_nlp_response(get_response)
        # Look up standard and valid conceptIDs for concept codes
        # Append conceptID to item in list, turn into a dictionary
        codes_dict = concept_code_to_id(codes)

        # Check each item in values and see whether NLP got a result
        # If NLP finds something, save the result to ScanReportConcept
        match = list(
            filter(lambda item: item["pk"] == str(field.id), codes_dict))

        for item in match:
            scan_report_field = ScanReportField.objects.get(pk=item["pk"])
            concept = Concept.objects.get(pk=item["conceptid"])

            ScanReportConcept.objects.create(
                nlp_entity=item["nlp_entity"],
                nlp_entity_type=item["nlp_entity_type"],
                nlp_confidence=item["nlp_confidence"],
                nlp_vocabulary=item["nlp_vocab"],
                nlp_concept_code=item["nlp_code"],
                concept=concept,
                content_object=scan_report_field,
            )

    else:
        # Grab assertions for the ScanReport
        assertions = ScanReportAssertion.objects.filter(
            scan_report__id=scan_report_id)
        neg_assertions = assertions.values_list("negative_assertion")

        # Grab values associated with the ScanReportField
        # Remove values in the negative assertions list
        scan_report_values = ScanReportValue.objects.filter(
            scan_report_field=search_term
        ).filter(~Q(value__in=neg_assertions))

        # Create list of items to be sent to the NLP service
        documents = []
        for item in scan_report_values:

            # If Field and Value Descriptions are both available then use both
            if item.scan_report_field.description_column and item.value_description:
                documents.append(
                    {"language": "en", "id": item.id,
                        "text": item.scan_report_field.description_column.replace("_", " ")+', '+item.value_description.replace("_", " ")}
                )
            else:
                # If neither descriptions are available use field and value names
                if item.scan_report_field.description_column is None and item.value_description is None:
                    documents.append(
                        {"language": "en", "id": item.id,
                            "text": item.scan_report_field.name.replace("_", " ")+', '+item.value.replace("_", " ")}
                    )
                else:
                    # Use a combination of field description and value names
                    if item.scan_report_field.description_column and item.value_description is None:
                        documents.append(
                            {"language": "en", "id": item.id,
                                "text": item.scan_report_field.description_column.replace("_", " ")+', '+item.value.replace("_", " ")}
                        )
                    else:
                        # Use a combination of field name and value description
                        if item.scan_report_field.description_column is None and item.value_description:
                            documents.append(
                                {"language": "en", "id": item.id,
                                    "text": item.scan_report_field.name.replace("_", " ")+', '+item.value_description.replace("_", " ")}
                            )

        print('VALUES LIST >>> ', documents)

        # POST Request(s)
        chunk_size = 10  # Set chunk size (max=10)
        post_response_url = []
        for i in range(0, len(documents), chunk_size):
            chunk = {"documents": documents[i: i + chunk_size]}
            payload = json.dumps(chunk)
            response = requests.post(url, headers=headers, data=payload)
            print(
                response.status_code,
                response.reason,
                response.headers["operation-location"],
            )
            post_response_url.append(response.headers["operation-location"])

        get_response = get_data_from_nlp(
            url=url, headers=headers, post_response_url=post_response_url
        )
        codes = process_nlp_response(get_response)
        codes_dict = concept_code_to_id(codes)

        # Mini function to see if all conceptIDs are the same
        def all_same(items):
            return all(x == items[0] for x in items)

        # Check each item in values and see whether NLP got a result
        # If NLP finds something, save the result to ScanReportConcept
        # If all conceptIDs across vocabs are the same, save only SNOMED
        # Else save each conceptID to ScanReportConcept
        for value in scan_report_values:
            match = list(
                filter(lambda item: item["pk"] == str(value.id), codes_dict))
            concept_ids = [li['conceptid'] for li in match]


            # If there are multiple conceptIDs from the above filter
            if len(concept_ids) > 0:
                # If all conceptIDs are the same, grab only the SNOMED entry
                # and save this to ScanReportConcept
                if all_same(concept_ids):
                    # Grab the SNOMED dictionary element
                    same = list(
                        filter(lambda item: item['nlp_vocab'] == 'SNOMEDCT_US', match))
                    scan_report_value = ScanReportValue.objects.get(
                        pk=same[0]["pk"])
                    concept = Concept.objects.get(pk=same[0]["conceptid"])

                    ScanReportConcept.objects.create(
                        nlp_entity=same[0]["nlp_entity"],
                        nlp_entity_type=same[0]["nlp_entity_type"],
                        nlp_confidence=same[0]["nlp_confidence"],
                        nlp_vocabulary=same[0]["nlp_vocab"],
                        nlp_concept_code=same[0]["nlp_code"],
                        concept=concept,
                        content_object=scan_report_value,
                    )

                else:

                    # If the conceptIDs are all different then save each to ScanReportConcept
                    for item in match:
                        scan_report_value = ScanReportValue.objects.get(
                            pk=item["pk"])
                        concept = Concept.objects.get(pk=item["conceptid"])

                        ScanReportConcept.objects.create(
                            nlp_entity=item["nlp_entity"],
                            nlp_entity_type=item["nlp_entity_type"],
                            nlp_confidence=item["nlp_confidence"],
                            nlp_vocabulary=item["nlp_vocab"],
                            nlp_concept_code=item["nlp_code"],
                            concept=concept,
                            content_object=scan_report_value,
                        )

    return True
