from typing import Any, Dict, Literal, Optional

from django.contrib.contenttypes.models import ContentType
from shared.data.models import ScanReportConcept
from shared.data.omop import Concept


def create_concept(
    concept_id: str,
    object_id: str,
    content_type: Literal["scanreportfield", "scanreportvalue"],
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
    content_type_model = ContentType.objects.get(model=content_type)
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
