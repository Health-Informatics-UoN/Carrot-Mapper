import json
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
    print(response.status_code, response.reason)
    post_response_url = response.headers["operation-location"]
    time.sleep(3)

    print("PROCESSING JOB >>>", post_response_url)

    # GET the response
    req = requests.get(post_response_url, headers=headers)
    job = req.json()

    # Loop to wait for the job to finish running
    get_response = []
    while job["status"] != "succeeded":
        print(job["status"])
        req = requests.get(post_response_url, headers=headers)
        job = req.json()
        print("Waiting...")
        time.sleep(3)
    else:
        get_response.append(job["results"])
        print("Completed! \n")

    resp = str(get_response[0])

    NLPModel.objects.filter(id=pk).update(json_response=resp)

    return True