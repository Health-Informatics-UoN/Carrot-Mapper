from typing import Dict, List, Tuple, Union

from django.contrib.contenttypes.models import ContentType
from shared.data.models import ScanReportConcept, ScanReportField, ScanReportValue
from shared_code import db
from shared_code.logger import logger
from shared_code.models import (
    ScanReportConceptContentType,
    ScanReportFieldDict,
    ScanReportValueDict,
)

"""
Functions for finding, mapping, and creation of reusable Scan Report Concepts.

Gets the existing list of Concepts on a Scan Report, and finds them to reuse.

This happens for Scan Report Fields and Values.

TODO: Move extract this out to it's own Azure Function, either if latency is not
a problem and won't really slow it down. Or when the functions are able to use the
database directly so the whole process is faster.
This can then include refactoring these into smaller functions, and remove the duplication.
"""


def reuse_existing_value_concepts(new_values_map: List[ScanReportValueDict]) -> None:
    """
    This expects a dict of value names to ids which have been generated in a newly
    uploaded scanreport and creates new concepts if any matching names are found
    with existing fields

    Args:
        new_fields_map (Dict[str, str]): A map of field names to Ids.
    """
    logger.info("reuse_existing_value_concepts")
    content_type_enum = ScanReportConceptContentType.VALUE

    # Gets all scan report concepts that are for the type value
    # (or content type which should be value) and in "active" SRs
    content_type = ContentType.objects.get(model=content_type_enum.value)
    value_ids = ScanReportValue.objects.filter(
        scan_report_field__scan_report_table__scan_report__hidden=False,
        scan_report_field__scan_report_table__scan_report__parent_dataset__hidden=False,
        scan_report_field__scan_report_table__scan_report__status="COMPLET",
    ).values_list("id", flat=True)
    existing_value_concepts = ScanReportConcept.objects.filter(
        content_type=content_type, object_id__in=value_ids
    ).all()

    # create dictionary that maps existing value ids to scan report concepts
    # from the list of existing scan report concepts
    existing_value_id_to_concept_map = {
        str(element.object_id): str(element.concept.concept_id)
        for element in existing_value_concepts
    }
    logger.debug(
        f"value_id:concept_id for all existing values in active SRs with concepts: "
        f"{existing_value_id_to_concept_map}"
    )

    # get details of existing selected values, for the purpose of matching against
    existing_value_ids = [value.object_id for value in existing_value_concepts]
    existing_values_filtered_by_id = ScanReportValue.objects.filter(
        id__in=existing_value_ids
    ).all()
    logger.debug("existing_values_filtered_by_id")

    # existing_values_filtered_by_id now contains the id,value,value_dec,
    # scan_report_field of each value got from the active concepts filter.
    logger.debug(
        f"ids, values and value descriptions of existing values in active SRs with "
        f"concepts: {existing_values_filtered_by_id}"
    )

    # get field ids from values and use to get scan report fields' details
    existing_field_ids = {
        item.scan_report_field.id for item in existing_values_filtered_by_id
    }
    existing_fields = ScanReportField.objects.filter(id__in=existing_field_ids).all()
    logger.debug(
        f"ids and names of existing fields associated to values with concepts in "
        f"active SRs: {existing_fields}"
    )

    existing_field_id_to_name_map = {
        str(field.pk): field.name for field in existing_fields
    }
    logger.debug(f"{existing_field_id_to_name_map=}")

    # Combine everything of the existing values to get this list, one for each
    # existing SRValue with a SRConcept in an active SR.
    existing_mappings_to_consider = [
        {
            "name": value.value,
            "concept": existing_value_id_to_concept_map[str(value.pk)],
            "id": value.pk,
            "description": value.value_description,
            "field_name": existing_field_id_to_name_map[
                str(value.scan_report_field.id)
            ],
        }
        for value in existing_values_filtered_by_id
    ]

    # Now handle the newly-added values in a similar manner
    logger.debug("new_paginated_field_ids")
    new_field_ids = [value["scan_report_field"]["id"] for value in new_values_map]
    new_fields = ScanReportField.objects.filter(id__in=new_field_ids).all()
    logger.debug(f"fields of newly generated values: {new_fields}")

    new_fields_to_name_map = {str(field.pk): field.name for field in new_fields}

    new_values_full_details = [
        {
            "name": value["value"],
            "description": value["value_description"],
            "field_name": new_fields_to_name_map[str(value["scan_report_field"]["id"])],
            "id": value["id"],
        }
        for value in new_values_map
    ]

    # Now we have existing_mappings_to_consider of the form:
    #
    # [{"id":, "name":, "concept":, "description":, "field_name":}]
    #
    # and new_values_full_details of the form:
    #
    # [{"id":, "name":, "description":, "field_name":}]

    # Now we simply look for unique matches on (name, description, field_name) across
    # the two.

    # value_details_to_value_and_concept_id_map will contain
    # (name, description, field_name) -> (value_id, concept_id)
    # for each value/description/field tuple in new_values_full_details
    # if that tuple has only one match in existing_mappings_to_consider
    value_details_to_value_and_concept_id_map = {}
    for item in new_values_full_details:
        name = item["name"]
        description = item["description"]
        field_name = item["field_name"]
        mappings_matching_value_name = list(
            filter(
                lambda mapping: mapping["name"] == name
                and mapping["description"] == description
                and mapping["field_name"] == field_name,
                existing_mappings_to_consider,
            )
        )

        target_concept_ids = {
            mapping["concept"] for mapping in mappings_matching_value_name
        }

        if len(target_concept_ids) == 1:
            target_value_id = (
                mapping["id"] for mapping in mappings_matching_value_name
            )
            value_details_to_value_and_concept_id_map[
                (str(name), str(description), str(field_name))
            ] = (str(next(target_value_id)), str(target_concept_ids.pop()))

    # Use the new_values_full_details as keys into
    # value_details_to_value_and_concept_id_map to extract concept IDs and details
    # for new ScanReportConcept entries to post.
    if concepts_to_post := select_concepts_to_post(
        new_values_full_details,
        value_details_to_value_and_concept_id_map,
        content_type_enum,
    ):
        ScanReportConcept.objects.bulk_create(concepts_to_post)
        logger.info("POST concepts all finished in reuse_existing_value_concepts")


def reuse_existing_field_concepts(new_fields_map: List[ScanReportFieldDict]) -> None:
    """
    Creates new concepts associated to any field that matches the name of an existing
    field with an associated concept.

    This expects a list of field names to ids which have been generated in a uploaded
    scanreport, and content_type 15.

    Args:
        new_fields_map (List[Dict[str, Any]]): A list of fields.

    Returns:
        None
    """
    logger.info("reuse_existing_field_concepts")
    content_type_enum = ScanReportConceptContentType.FIELD

    content_type = ContentType.objects.get(model=content_type_enum.value)
    field_ids = ScanReportField.objects.filter(
        scan_report_table__scan_report__hidden=False,
        scan_report_table__scan_report__parent_dataset__hidden=False,
        scan_report_table__scan_report__status="COMPLET",
    ).values_list("id", flat=True)
    existing_field_concepts = ScanReportConcept.objects.filter(
        content_type=content_type, object_id__in=field_ids
    ).all()

    # create dictionary that maps existing field ids to scan report concepts
    # from the list of existing scan report concepts from active SRs
    existing_field_id_to_concept_map = {
        str(element.object_id): str(element.concept)
        for element in existing_field_concepts
    }
    logger.debug(
        f"field_id:concept_id for all existing fields in active SRs with concepts: "
        f"{existing_field_id_to_concept_map}"
    )

    # get details of existing selected fields, for the purpose of matching against
    # new fields
    existing_field_ids = {item.object_id for item in existing_field_concepts}
    existing_fields = ScanReportField.objects.filter(id__in=existing_field_ids).all()
    logger.debug(
        f"ids and names of existing fields with concepts in active SRs:"
        f" {existing_fields}"
    )

    # Combine everything of the existing fields to get this list, one for each
    # existing SRField with a SRConcept in an active SR.
    existing_mappings_to_consider = [
        {
            "name": field.name,
            "concept": existing_field_id_to_concept_map[str(field.pk)],
            "id": field.pk,
        }
        for field in existing_fields
    ]
    logger.debug(f"{existing_mappings_to_consider=}")

    # Handle the newly-added fields
    new_fields_full_details = [
        {"name": field["name"], "id": str(field["id"])} for field in new_fields_map
    ]
    # Now we have existing_mappings_to_consider of the form:
    #
    # [{"id":, "name":, "concept":}]
    #
    # and new_fields_full_details of the form:
    #
    # [{"id":, "name":}]

    # Now we simply look for unique matches on "name" across
    # the two.

    # existing_field_name_to_field_and_concept_id_map will contain
    # (field_name) -> (field_id, concept_id)
    # for each field in new_fields_full_details
    # if that field has only one match in existing_mappings_to_consider
    existing_field_name_to_field_and_concept_id_map = {}
    for item in new_fields_full_details:
        name = item["name"]
        mappings_matching_field_name = list(
            filter(
                lambda mapping: mapping["name"] == name, existing_mappings_to_consider
            )
        )

        target_concept_ids = {
            mapping["concept"] for mapping in mappings_matching_field_name
        }

        if len(target_concept_ids) == 1:
            target_field_id = (
                mapping["id"] for mapping in mappings_matching_field_name
            )
            existing_field_name_to_field_and_concept_id_map[str(name)] = (
                str(next(target_field_id)),
                str(target_concept_ids.pop()),
            )

    # Use the new_fields_full_details as keys into
    # existing_field_name_to_field_and_concept_id_map to extract concept IDs and details
    # for new ScanReportConcept entries to post.
    if concepts_to_post := select_concepts_to_post(
        new_fields_full_details,
        existing_field_name_to_field_and_concept_id_map,
        content_type_enum,
    ):
        ScanReportConcept.objects.bulk_create(concepts_to_post)
        logger.info("POST concepts all finished in reuse_existing_field_concepts")


def select_concepts_to_post(
    new_content_details: List[Dict[str, str]],
    details_to_id_and_concept_id_map: Union[
        Dict[str, Tuple[str, str]],
        Dict[
            Tuple[
                str,
                str,
                str,
            ],
            Tuple[str, str],
        ],
    ],
    content_type: ScanReportConceptContentType,
) -> List[ScanReportConcept]:
    """
    Depending on the content_type, generate a list of `ScanReportConcepts` to be created.
    Content_type controls whether this is handling fields or values.
    Fields have a key defined only by name, while values have a key defined by:
      name, description, and field name.

    Args:
        new_content_details (List[Dict[str, str]]):
          Each item in the list a dict containing either "id" and "name" keys (for fields)
          or "id", "name", "description", and "field_name" keys (for values).

        details_to_id_and_concept_id_map (List[Dict[str, str]]): keys "name" (for fields) or ("name",
          "description", "field_name") keys (for values), with entries (field_id, concept_id)
          or (value_id, concept_id) respectively.

        content_type (Literal["scanreportfield", "scanreportvalue"]): Controls whether to handle ScanReportFields, or ScanReportValues.

    Returns:
        A list of reused `Concepts` to create.

    Raises:
        Exception:  ValueError: A content_type other than scanreportfield or scanreportvalue was provided.
    """
    concepts_to_post: List[ScanReportConcept] = []
    key: Union[str, Tuple[str, str, str]]

    for new_content_detail in new_content_details:
        if content_type == ScanReportConceptContentType.FIELD:
            key = str(new_content_detail["name"])
        elif content_type == ScanReportConceptContentType.VALUE:
            key = (
                str(new_content_detail["name"]),
                str(new_content_detail["description"]),
                str(new_content_detail["field_name"]),
            )
        else:
            raise ValueError(f"Unsupported content_type: {content_type}")

        try:
            existing_content_id, concept_id = details_to_id_and_concept_id_map[key]  # type: ignore
            logger.info(
                f"Found existing {'field' if content_type == ScanReportConceptContentType.FIELD else 'value'} with id: {existing_content_id} "
                f"with existing concept mapping: {concept_id} which matches new {'field' if content_type == ScanReportConceptContentType.FIELD else 'value'} id: {new_content_detail['id']}"
            )
            if concept_entry := db.create_concept(
                concept_id, str(new_content_detail["id"]), content_type, "R"
            ):
                concepts_to_post.append(concept_entry)
        except KeyError:
            continue

    return concepts_to_post
