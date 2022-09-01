import os
import time
import requests
import logging
from collections import defaultdict
from ProcessQueue import helpers

api_url = os.environ.get("APP_URL") + "api/"
api_header = {"Authorization": "Token {}".format(os.environ.get("AZ_FUNCTION_KEY"))}
logger = logging.getLogger("test_logger")

max_chars_for_get = 2000


def find_standard_concept_batch(source_concepts: list):
    """
    Given a list of dictionaries, each of which contains a 'concept_id' entry,
    return a dictionary mapping from the original concept_ids to all standard
    concepts it maps to via ConceptRelationship.

    example:
    - input
      [{'id': 2575531, 'value': 'V68.0', ..., 'frequency': 2000,
        'conceptID': -1, 'vocabulary_id': 'ICD9CM', 'concept_id': '45890989',
        'standard_concept': 'None'},
       {'id': 2575530, 'value': '804.35', ..., 'frequency': 1000,
        'conceptID': -1, 'vocabulary_id': 'ICD9CM', 'concept_id': '44829331',
        'standard_concept': 'None'}
       ]

    - output
      defaultdict(<class 'list'>, {44829331: [380844, 4302223, 4307254, 42872561],
                                   45890989: [4148832]}
                  )
    """
    logger.debug("find_standard_concept_batch()")
    # Exit early rather than having to handle this case in later code.
    if len(source_concepts) == 0:
        return {}

    # Paginate the source concepts
    paginated_source_concepts = helpers.paginate(
        (str(source_concept["concept_id"]) for source_concept in source_concepts),
        max_chars=max_chars_for_get,
    )

    # Get "Maps to" relations of all source concepts supplied
    concept_relations_response = []
    for page in paginated_source_concepts:
        page_of_concept_ids_to_get = ",".join(map(str, page))
        get_concept_relations_response = requests.get(
            url=f"{api_url}omop/conceptrelationshipfilter/?concept_id_1__in="
            + f"{page_of_concept_ids_to_get}&relationship_id=Maps to",
            headers=api_header,
        )
        concept_relations_response.append(get_concept_relations_response.json())
    concept_relations = helpers.flatten(concept_relations_response)

    # Find those concepts with a "trail" to follow, that is, those which have
    # differing concept_id_1/2.
    filtered_concept_relations = [
        concept_relation
        for concept_relation in concept_relations
        if concept_relation["concept_id_2"] != concept_relation["concept_id_1"]
    ]

    paginated_concept_id_2s = helpers.paginate(
        (str(relation["concept_id_2"]) for relation in filtered_concept_relations),
        max_chars=max_chars_for_get,
    )
    # Send all of those to conceptfilter again to check they are standard.
    concepts = []
    for page in paginated_concept_id_2s:
        concept_id_2s_to_get = ",".join(map(str, page))
        get_concepts = requests.get(
            url=f"{api_url}omop/conceptsfilter/?concept_id__in={concept_id_2s_to_get}",
            headers=api_header,
        )
        concepts.append(get_concepts.json())
    concepts = helpers.flatten(concepts)
    logger.debug("concepts got")

    concept_details = {a["concept_id"]: a["standard_concept"] for a in concepts}

    # Filter by those concepts relationships where the second concept_id is standard
    # Now combine the pairs so that each pair is of type tuple(str, list(str))
    combined_pairs = defaultdict(list)
    for relationship in filtered_concept_relations:
        if concept_details[relationship["concept_id_2"]] == "S":
            combined_pairs[relationship["concept_id_1"]].append(
                relationship["concept_id_2"]
            )

    return combined_pairs


def find_standard_concept(source_concept):

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
        return {"concept_id": -1}
        # raise RuntimeWarning("concept_relation is empty in vocab")
    concept_relation = concept_relation[0]

    if concept_relation["concept_id_2"] != concept_relation["concept_id_1"]:
        concept = requests.get(
            url=api_url + "omop/conceptsfilter",
            headers=api_header,
            params={"concept_id": concept_relation["concept_id_2"]},
        )
        concept = concept.json()
        if len(concept) == 0:
            raise RuntimeWarning("concept filter returned empty")
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

    # obtain the source_concept given the code and vocab
    source_concept = requests.get(
        url=api_url + "omop/conceptsfilter",
        headers=api_header,
        params={"concept_code": concept_code, "vocabulary_id": vocabulary_id},
    )

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
