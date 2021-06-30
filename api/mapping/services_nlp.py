import base64
import json
import logging
import os
import time
from azure.storage.queue import QueueClient

import requests
from data.models import Concept, ConceptRelationship
from django.db.models import Q
from django.contrib import messages

from .models import (Document, ScanReport, ScanReportAssertion, ScanReportConcept,
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


def start_nlp_field_level(request, search_term):

    field = ScanReportField.objects.get(pk=search_term)
    scan_report_id = field.scan_report_table.scan_report.id

    # Checks to see if the field is 'pass_from_source'
    # If True, we pass field-level data i.e. a single string (field description)
    # If False, we pass all values associated with that field
    if field.pass_from_source:

        # We want to use the field description if available
        # However, we fall back to field name if field_description is "" (blank)
        field_text = field.description_column if field.description_column is not "" else field.name

        document = {
            "documents": [
                {
                    "language": "en",
                    "id": str(field.id)+'_field',
                    "text": field_text.replace("_", " ")
                }
            ]
        }

        payload = json.dumps(document)

        message_bytes = payload.encode('ascii')
        base64_bytes = base64.b64encode(message_bytes)
        base64_message = base64_bytes.decode('ascii')

        # Send JSON payload to nlp-processing-queue in Azure
        queue = QueueClient.from_connection_string(
            conn_str=os.environ.get("STORAGE_CONN_STRING"),
            queue_name="nlpqueue",
        )

        queue.send_message(base64_message)

        messages.success(request, "Running NLP at the field level for {}. Check back soon for results from the NLP API.".format(
            field.name)
        )

        return True

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

        messages.success(request, "Running NLP at the value level for {}. Check back soon for results from the NLP API.".format(
            field.name)
        )

        # Send data to Azure Storage Queue
        for item in scan_report_values:

            field_text = item.scan_report_field.description_column if item.scan_report_field.description_column is not None else item.scan_report_field.name
            value_text = item.value_description if item.value_description is not None else item.value

            document = {
                "documents": [
                    {
                        "language": "en",
                        "id": str(item.id)+'_value',
                        "text": field_text.replace("_", " ")+', '+value_text.replace("_", " ")
                    }
                ]
            }

            payload = json.dumps(document)

            message_bytes = payload.encode('ascii')
            base64_bytes = base64.b64encode(message_bytes)
            base64_message = base64_bytes.decode('ascii')

            # Send JSON payload to nlp-processing-queue in Azure
            queue = QueueClient.from_connection_string(
                conn_str=os.environ.get("STORAGE_CONN_STRING"),
                queue_name="nlpqueue"
            )
            queue.send_message(base64_message)

    return True
