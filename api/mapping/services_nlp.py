import json
import pandas as pd
import requests
import time

from .models import NLPModel
from coconnect.tools.omop_db_inspect import OMOPDetails

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

    full_results = full_results.merge(
        codes_df, left_on="concept_code", right_on="code"
    )
    full_results = full_results.values.tolist()
            
    return full_results