import json
import pandas as pd
import requests
import time
import os
from django.db.models import Q
from .models import (
    NLPModel,
    ScanReport,
    ScanReportField,
    ScanReportValue,
    ScanReportAssertion,
    ScanReportConcept,
    DataDictionary,
)
from data.models import ConceptRelationship 
from coconnect.tools.omop_db_inspect import OMOPDetails
from .services import get_concept_from_concept_code, find_standard_concept

def start_nlp(search_term):

    print(">>>>> Running NLP in services_nlp.py for", search_term)
    field = ScanReportField.objects.get(pk=search_term)
    scan_report_id = field.scan_report_table.scan_report.id

    # Define NLP URL/headers
    url = "https://ccnett2.cognitiveservices.azure.com/text/analytics/v3.1-preview.3/entities/health/jobs?stringIndexType=TextElements_v8"
    headers = {
        "Ocp-Apim-Subscription-Key": os.environ.get("NLP_API_KEY"),
        "Content-Type": "application/json; utf-8",
    }

    # Checks to see if the field is 'pass_from_source'
    # If True, we pass field-level data. If False, we pass all values
    # associated with that field
    if field.pass_from_source:
        print(">>> Working at field level...")

    else:
        print(">>> Working at values level...")

        # Grab assertions for the ScanReport
        assertions = ScanReportAssertion.objects.filter(scan_report__id=scan_report_id)
        neg_assertions = assertions.values_list("negative_assertion")

        # Grab values associated with the ScanReportField
        # Remove values in the negative assertions list
        values = ScanReportValue.objects.filter(scan_report_field=search_term).filter(
            ~Q(value__in=neg_assertions)
        )
        
        # Create list of ScanReportValue PKs so we can later track
        # which values couldn't be processed via NLP
        # (annoyingly, NLP doesn't return anything if there's no match for a string)
        values_keys = []
        for item in values:
            values_keys.append(item.id)

        # Create list of items to be sent to the NLP service
        documents = []
        for item in values:
            documents.append(
                {"language": "en", "id": item.id, "text": item.value_description}
            )
            
        print(documents)

        # POST Request(s)
        chunk_size = 10  # Set chunk size (max=10)
        post_response_url = []
        for i in range(0, len(documents), chunk_size):
            chunk = {"documents": documents[i : i + chunk_size]}
            payload = json.dumps(chunk)
            response = requests.post(url, headers=headers, data=payload)
            print(
                response.status_code,
                response.reason,
                response.headers["operation-location"],
            )
            post_response_url.append(response.headers["operation-location"])

        # GET the response
        get_response = []
        for url in post_response_url:

            print("PROCESSING JOB >>>", url)
            req = requests.get(url, headers=headers)
            job = req.json()

            while job["status"] != "succeeded":
                req = requests.get(url, headers=headers)
                job = req.json()
                print("Waiting...")
                time.sleep(3)
            else:
                get_response.append(job["results"])
                print("Done!")

        codes = []
        keep = ["ICD9", "ICD10", "RXNORM", "SNOMEDCT_US", "SNOMED"]
        keys = ["pk", "nlp_entity", "nlp_entity_type", "nlp_confidence", "nlp_vocab", "nlp_code", "conceptid"]

        # Mad nested for loops to get at the data in the response
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
                                    
        codes_dict = []
        for item in codes:
            print(item[5])
            print(item[4])
            x = get_concept_from_concept_code(concept_code=str(item[5]), vocabulary_id=str(item[4]))
            print(x[1])
            item.append('foobar')
            codes_dict.append(dict(zip(keys, item)))
        
        # print(codes_dict)
        
        # for i in values:
        #     print(i)
            
        #     ScanReportConcept.objects.create(
            
        #     nlp_entity = ,
        #     concept=concept,
        #     content_object=scan_report_value,   
        #     )
        
        
 
    return True


def nlp_single_string(pk, dict_string):

    """
    This function allows you to pass a single text string to NLP
    and return a list of all valid and standard OMOP codes for the
    computed entity

    Returns a pandas dataframe

    """

    # Translate queryset into JSON-like dict for NLP
    documents = []
    documents.append(
        {
            "language": "en",
            "id": 1,
            "text": dict_string,
        }
    )

    chunk = {"documents": documents}

    # Define NLP URL/headers
    url = "https://ccnett2.cognitiveservices.azure.com/text/analytics/v3.1-preview.3/entities/health/jobs?stringIndexType=TextElements_v8"
    headers = {
        "Ocp-Apim-Subscription-Key": os.environ.get("NLP_API_KEY"),
        "Content-Type": "application/json; utf-8",
    }

    # Create payload, POST to the NLP servoce
    payload = json.dumps(chunk)
    response = requests.post(url, headers=headers, data=payload)
    post_response_url = response.headers["operation-location"]
    time.sleep(3)

    # GET the response
    req = requests.get(post_response_url, headers=headers)
    job = req.json()

    # Loop to wait for the job to finish running
    get_response = []
    while job["status"] != "succeeded":
        req = requests.get(post_response_url, headers=headers)
        job = req.json()
        time.sleep(3)
    else:
        get_response.append(job["results"])

    resp = str(get_response[0])

    NLPModel.objects.filter(id=pk).update(json_response=resp)

    return True


def get_json_from_nlpmodel(json):

    """
    A small function to process the JSON string saved in NLPModel
    """

    # Define which codes we want to keep. Add more here as required.
    codes = []
    keep = ["ICD9", "ICD10", "RXNORM", "SNOMEDCT_US"]

    json_response = json

    # Mad nested for loops to get at the data in the response
    for dict_entry in json_response["documents"]:
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

    # Create pandas datafram of results
    codes_df = pd.DataFrame(
        codes,
        columns=["key", "entity", "category", "confidence", "vocab", "code"],
    )

    # Load in OMOPDetails class from Co-Connect Tools
    omop_lookup = OMOPDetails()

    # This block looks up each concept *code* and returns
    # OMOP standard conceptID
    results = []
    for index, row in codes_df.iterrows():
        results.append(omop_lookup.lookup_code(row["code"]))

    full_results = pd.concat(results, ignore_index=True)

    full_results = full_results.merge(codes_df, left_on="concept_code", right_on="code")
    full_results = full_results.values.tolist()

    return full_results