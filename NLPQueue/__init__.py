import json
import requests
import azure.functions as func
import os

from shared_code import omop_helpers

api_url = os.environ.get("APP_URL") + "api/"
api_header = {"Authorization": "Token {}".format(os.environ.get("AZ_FUNCTION_KEY"))}


def main(msg: func.QueueMessage):

    # Define NLP things
    url = "https://ccnett2.cognitiveservices.azure.com/text/analytics/v3.1-preview.5/entities/health/jobs?stringIndexType=TextElements_v8"
    headers = {
        "Ocp-Apim-Subscription-Key": os.environ.get("NLP_API_KEY"),
        "Content-Type": "application/json; utf-8",
    }

    message = json.dumps({"id": msg.id, "body": msg.get_body().decode("utf-8"),})

    message = json.loads(message)
    print("MESSAGE >>> ", message)
    print(message["body"])

    post_response_url = []
    response = requests.post(url, headers=headers, data=message["body"])
    post_response_url.append(response.headers["operation-location"])

    # Get the data back from NLP API, convert code to conceptIDs
    get_response = omop_helpers.get_data_from_nlp(
        url=url, headers=headers, post_response_url=post_response_url
    )

    codes = omop_helpers.process_nlp_response(get_response)
    codes_dict = omop_helpers.concept_code_to_id(codes)

    for item in codes_dict:

        if item["pk"].split("_")[1] == "field":

            print("SAVING TO FIELD LEVEL...")
            payload = {
                "nlp_entity": item["nlp_entity"],
                "nlp_entity_type": item["nlp_entity_type"],
                "nlp_confidence": item["nlp_confidence"],
                "nlp_vocabulary": item["nlp_vocab"],
                "nlp_concept_code": item["nlp_code"],
                "concept": item["conceptid"],
                "object_id": item["pk"].split("_")[0],
                "content_type": 15,
            }

        else:

            print("SAVING TO VALUE LEVEL...")
            payload = {
                "nlp_entity": item["nlp_entity"],
                "nlp_entity_type": item["nlp_entity_type"],
                "nlp_confidence": item["nlp_confidence"],
                "nlp_vocabulary": item["nlp_vocab"],
                "nlp_concept_code": item["nlp_code"],
                "concept": item["conceptid"],
                "object_id": item["pk"].split("_")[0],
                "content_type": 17,
            }

        print("PAYLOAD >>>", payload)

        response = requests.post(
            url=api_url + "scanreportconcepts/", headers=api_header, data=payload
        )
