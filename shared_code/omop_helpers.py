import requests, json, os, time

api_url = os.environ.get("APP_URL") + "api/"
api_header = {"Authorization": "Token {}".format(os.environ.get("AZ_FUNCTION_KEY"))}


def find_standard_concept(source_concept):

    concept_relation = requests.get(
        url=api_url + "omop/conceptrelationshipfilter",
        headers=api_header,
        params={
            "concept_id_1": source_concept["concept_id"],
            "relationship_id": "Maps to",
        },
    )

    concept_relation = json.loads(concept_relation.content.decode("utf-8"))
    concept_relation = concept_relation[0]

    if concept_relation["concept_id_2"] != concept_relation["concept_id_1"]:
        concept = requests.get(
            url=api_url + "omop/conceptsfilter",
            headers=api_header,
            params={"concept_id": concept_relation["concept_id_2"]},
        )
        concept = json.loads(concept.content.decode("utf-8"))
        concept = concept[0]
        return concept
    else:
        # may need some warning if this ever happens?
        return source_concept


def get_concept_from_concept_code(concept_code, vocabulary_id, no_source_concept=False):

    # NLP returns SNOMED as SNOWMEDCT_US
    # This sets SNOWMEDCT_US to SNOWMED if this function is
    # used within services_nlp.py
    if vocabulary_id == "SNOMEDCT_US":
        vocabulary_id = "SNOMED"

    # It's RXNORM in NLP but RxNorm in OMOP db, so must convert
    if vocabulary_id == "RXNORM":
        vocabulary_id = "RxNorm"
    else:
        vocabulary_id = vocabulary_id

    # obtain the source_concept given the code and vocab
    source_concept = requests.get(
        url=api_url + "omop/conceptsfilter",
        headers=api_header,
        params={"concept_code": concept_code, "vocabulary_id": vocabulary_id},
    )

    source_concept = json.loads(source_concept.content.decode("utf-8"))
    source_concept = source_concept[0]

    # if the source_concept is standard
    if source_concept["standard_concept"] == "S":
        # the concept is the same as the source_concept
        concept = source_concept
    else:
        # otherwise we need to look up
        concept = find_standard_concept(source_concept)

    if no_source_concept:
        # only return the concept
        return concept
    else:
        # return both as a tuple
        return (source_concept, concept)


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

            item.append(x[1]["concept_id"])
            codes_dict.append(dict(zip(keys, item)))
        except:
            print("Concept Code", item[5], "not found!")

    return codes_dict


def get_data_from_nlp(url, headers, post_response_url):

    for url in post_response_url:

        req = requests.get(url, headers=headers)
        job = req.json()

        while job["status"] != "succeeded":
            print("Waiting...")
            req = requests.get(url, headers=headers)
            job = req.json()
            time.sleep(3)
        else:
            get_response = job["results"]

    return get_response


def process_nlp_response(get_response):
    """
    This function takes as input an NLP GET response
    and returns a list of concept codes.

    Input: get_response - A list of GET responses
    Output: codes - A list of concept Codes

    """
    keep = ["ICD9CM", "ICD10CM", "RXNORM", "SNOMEDCT_US", "SNOMED", "NCI"]
    codes = []

    for dict_entry in get_response["documents"]:
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
