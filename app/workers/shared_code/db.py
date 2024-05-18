from collections import OrderedDict, defaultdict
from typing import List, Literal, Optional, Union

from django.contrib.contenttypes.models import ContentType
from shared.data.models import ScanReportConcept
from shared.data.omop import Concept, ConceptRelationship
from shared_code.logger import logger
from shared_code.models import ScanReportConceptContentType, ScanReportValueDict


def create_concept(
    concept_id: Union[str, int],
    object_id: str,
    content_type: ScanReportConceptContentType,
    creation_type: Literal["V", "R"] = "V",
) -> Optional[ScanReportConcept]:
    """
    Creates a new ScanReportConcept

    Args:
        - concept_id (str): The Id of the Concept to create.
        - object_id (str): The Object Id of the Concept to create.
        - content_type (Literal["scanreportfield", "scanreportvalue"]): The Content Type of the Concept.
        - creation_type (Literal["R", "V"], optional): The Creation Type value of the Concept.

    Returns:
        Dict[str, Any]: A Concept as a dictionary.
    """
    # Check:
    content_type_model = ContentType.objects.get(model=content_type.value)
    concept_check = ScanReportConcept.objects.filter(
        concept=concept_id,
        object_id=object_id,
        content_type=content_type_model,
    ).count()

    if concept_check > 0:
        return None

    return ScanReportConcept(
        concept_id=concept_id,
        object_id=object_id,
        content_type=content_type_model,
        creation_type=creation_type,
    )


def find_standard_concept_batch(source_concepts: List[ScanReportValueDict]):
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

    # Get "Maps to" relations of all source concepts supplied
    concept_ids = [concept["concept_id"] for concept in source_concepts]
    concept_relationships = ConceptRelationship.objects.filter(
        relationship_id="Maps to", concept_id_1__in=concept_ids
    ).all()

    # Find those concepts with a "trail" to follow, that is, those which have
    # differing concept_id_1/2.
    filtered_concept_relations = list(
        filter(
            lambda concept_relation: concept_relation.concept_id_2
            != concept_relation.concept_id_1,
            concept_relationships,
        )
    )

    # Send all of those to conceptfilter again to check they are standard.
    concept_id_2s = [relation.concept_id_2 for relation in filtered_concept_relations]
    concepts = Concept.objects.filter(concept_id__in=concept_id_2s).all()
    concept_details = {a.concept_id: a.standard_concept for a in concepts}

    logger.debug("concepts got")

    # Filter by those concepts relationships where the second concept_id is standard
    # Now combine the pairs so that each pair is of type tuple(str, list(str))
    combined_pairs = defaultdict(list)
    for relationship in filtered_concept_relations:
        if concept_details[relationship.concept_id_2] == "S":
            combined_pairs[relationship.concept_id_1].append(relationship.concept_id_2)

    # Remove duplicates from within each entry, by converting each to an Ordered Dict
    # (the keys of which must be unique, and will preserve the order if that's
    # important) and then back to a list.
    for pair in combined_pairs:
        combined_pairs[pair] = list(OrderedDict.fromkeys(combined_pairs[pair]))

    return combined_pairs
