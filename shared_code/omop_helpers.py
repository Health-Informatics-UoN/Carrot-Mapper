import requests, os, time
import logging

api_url = os.environ.get("APP_URL") + "api/"
api_header = {"Authorization": "Token {}".format(os.environ.get("AZ_FUNCTION_KEY"))}
logger = logging.getLogger("test_logger")


def find_many_standard_concepts(source_concepts):
    # Get "Maps to" relations of all source concepts that aren't standard
    concept_relations = requests.get(
        url=api_url + "omop/conceptrelationshipfilter/?concept_id_1__in="
            + ','.join(source_concept["concept_id"] for source_concept in source_concepts) +
                "&relationship_id=Maps to",
        headers=api_header,
    ).json()

    non_last_target_concepts = []
    for concept_relation in concept_relations:
        if concept_relation["concept_id_2"] != concept_relation["concept_id_1"]:
            non_last_target_concepts.append(concept_relation)

    concepts = requests.get(
        url=api_url + f"omop/conceptsfilter/?concept_code__in="
                      f"{','.join(relation['concept_id_2'] for relation in non_last_target_concepts)}",
        headers=api_header,
    )


def find_standard_concept(source_concept):
    # TODO: ideally this should legitimately return ALL the standard concepts
    #  associated, which may be more than one!
    concept_relation = requests.get(
        url=api_url + "omop/conceptrelationshipfilter",
        headers=api_header,
        params={
            "concept_id_1": source_concept["concept_id"],
            "relationship_id": "Maps to",
        },
    )

    concept_relation = concept_relation.json()
    if len(concept_relation) == 0:
        raise RuntimeWarning("concept_relation is empty in vocab")
    for relation in concept_relation:
        if relation["concept_id_2"] != relation["concept_id_1"]:
            concept = requests.get(
                url=api_url + "omop/conceptsfilter",
                headers=api_header,
                params={"concept_id": relation["concept_id_2"]},
            )
            concept = concept.json()
            # if empty, then conceptsfilter can't find an entry for the second
            # concept in this relationship, so try the next relationship
            if len(concept) == 0:
                continue
            # Not empty, so we've found an entry for the second concept in the
            # relationship.
            concept = concept[0]
            # Check whether this is a standard concept: if it's not, move on
            if concept["standard_concept"] != 'S':
                continue

            return concept

        # may need some warning if this ever happens?
        return source_concept
    # If none of the relationships yielded a second concept with an entry in the
    # Concepts table, then return no concept, and the mapping will not go ahead.
    logger.info(f"concept filter of {relation['concept_id_2']} (from "
                f"{relation['concept_id_1']} returned empty")
    source_concept["concept_id"] = -1
    return source_concept



async def get_concept_from_concept_code(concept_code, vocabulary_id, client,
                                        no_source_concept=False):

    # NLP returns SNOMED as SNOWMEDCT_US
    # This sets SNOWMEDCT_US to SNOWMED if this function is
    # used within services_nlp.py
    if vocabulary_id == "SNOMEDCT_US":
        vocabulary_id = "SNOMED"

    # It's RXNORM in NLP but RxNorm in OMOP db, so must convert
    if vocabulary_id == "RXNORM":
        vocabulary_id = "RxNorm"

    # obtain the source_concept given the code and vocab
    source_concept = await client.get(
        url=api_url + "omop/conceptsfilter/",
        headers=api_header,
        params={"concept_code": concept_code, "vocabulary_id": vocabulary_id},
    )

    # source_concept = requests.get(
    #     url=api_url + "omop/conceptsfilter",
    #     headers=api_header,
    #     params={"concept_code": concept_code, "vocabulary_id": vocabulary_id},
    # )

    source_concept = source_concept.json()
    if len(source_concept) == 0:
        raise RuntimeWarning("concept_code not recognised in vocab")
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
