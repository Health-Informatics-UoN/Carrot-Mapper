from typing import Any, Dict, List, Literal

from ProcessQueue import helpers
from shared_code import omop_helpers
from shared_code.api import (
    get_scan_report_active_concepts,
    get_scan_report_fields,
    get_scan_report_values,
    post_scan_report_concepts,
)
from shared_code.helpers import create_concept
from shared_code.logger import logger

"""
Functions for finding, mapping, and creation of reusable Scan Report Concepts.

Gets the existing list of Concepts on a Scan Report, and finds them to reuse.

This happens for Scan Report Fields and Values.

TODO: Move extract this out to it's own Azure Function, either if latency is not
a problem and won't really slow it down. Or when the functions are able to use the
database directly so the whole process is faster.
"""


def reuse_existing_value_concepts(new_values_map, content_type: Literal[17]) -> None:
    # sourcery skip: extract-duplicate-method, inline-immediately-returned-variable
    """
    This expects a dict of value names to ids which have been generated in a newly
    uploaded scanreport and creates new concepts if any matching names are found
    with existing fields

    TODO: Why the f is this is parameter if it only accepts one specific number?
    Is it that much different from reuse_existing_field_concepts... ?
    Args:
        new_fields_map (Dict[str, str]): A map of field names to Ids.
        content_type (Literal[17]): The content type, represents `ScanReportValue` (17)
    """
    logger.info("reuse_existing_value_concepts")
    # Gets all scan report concepts that are for the type value
    # (or content type which should be value) and in "active" SRs

    existing_value_concepts = get_scan_report_active_concepts(content_type)
    # create dictionary that maps existing value ids to scan report concepts
    # from the list of existing scan report concepts
    existing_value_id_to_concept_map = {
        str(element.get("object_id", None)): str(element.get("concept", None))
        for element in existing_value_concepts
    }
    logger.debug(
        f"value_id:concept_id for all existing values in active SRs with concepts: "
        f"{existing_value_id_to_concept_map}"
    )

    # get details of existing selected values, for the purpose of matching against
    # new values
    existing_paginated_value_ids = helpers.paginate(
        [value["object_id"] for value in existing_value_concepts],
        omop_helpers.max_chars_for_get,
    )
    logger.debug(f"{existing_paginated_value_ids=}")

    # for each list in paginated ids, get scanreport values that match any of the given
    # ids (those with an associated concept)
    existing_values_filtered_by_id = []
    for ids in existing_paginated_value_ids:
        ids_to_get = ",".join(map(str, ids))
        values = get_scan_report_values(ids_to_get)
        existing_values_filtered_by_id.append(values)
    existing_values_filtered_by_id = helpers.flatten(existing_values_filtered_by_id)
    logger.debug("existing_values_filtered_by_id")

    # existing_values_filtered_by_id now contains the id,value,value_dec,
    # scan_report_field of each value got from the active concepts filter.
    logger.debug(
        f"ids, values and value descriptions of existing values in active SRs with "
        f"concepts: {existing_values_filtered_by_id}"
    )

    # get field ids from values and use to get scan report fields' details
    existing_field_ids = {
        item["scan_report_field"] for item in existing_values_filtered_by_id
    }
    existing_fields = get_scan_report_fields(existing_field_ids)
    logger.debug(
        f"ids and names of existing fields associated to values with concepts in "
        f"active SRs: {existing_fields}"
    )

    existing_field_id_to_name_map = {
        str(field["id"]): field["name"] for field in existing_fields
    }
    logger.debug(f"{existing_field_id_to_name_map=}")

    # Combine everything of the existing values to get this list, one for each
    # existing SRValue with a SRConcept in an active SR.
    existing_mappings_to_consider = [
        {
            "name": value["value"],
            "concept": existing_value_id_to_concept_map[str(value["id"])],
            "id": value["id"],
            "description": value["value_description"],
            "field_name": existing_field_id_to_name_map[
                str(value["scan_report_field"])
            ],
        }
        for value in existing_values_filtered_by_id
    ]

    # Now handle the newly-added values in a similar manner
    logger.debug("new_paginated_field_ids")
    new_field_ids = [value["scan_report_field"] for value in new_values_map]
    new_fields = get_scan_report_fields(new_field_ids)
    logger.debug(f"fields of newly generated values: {new_fields}")

    new_fields_to_name_map = {str(field["id"]): field["name"] for field in new_fields}

    new_values_full_details = [
        {
            "name": value["value"],
            "description": value["value_description"],
            "field_name": new_fields_to_name_map[str(value["scan_report_field"])],
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
        content_type,
    ):
        post_scan_report_concepts(concepts_to_post)
        logger.info("POST concepts all finished in reuse_existing_value_concepts")


def reuse_existing_field_concepts(
    new_fields_map: List[Dict[str, str]], content_type: Literal[15]
) -> None:
    """
    Creates new concepts associated to any field that matches the name of an existing
    field with an associated concept.

    This expects a list of field names to ids which have been generated in a uploaded
    scanreport, and content_type 15.

    Args:
        new_fields_map (List[Dict[str, Any]]): A list of fields.
        content_type (Literal[15]): The content type, represents `ScanReportField` (15)

    Returns:
        None
    """
    logger.info("reuse_existing_field_concepts")
    # Gets all scan report concepts that are for the type field
    # (or content type which should be field) and in "active" SRs
    existing_field_concepts = get_scan_report_active_concepts(content_type)

    # create dictionary that maps existing field ids to scan report concepts
    # from the list of existing scan report concepts from active SRs
    existing_field_id_to_concept_map = {
        str(element.get("object_id", None)): str(element.get("concept", None))
        for element in existing_field_concepts
    }
    logger.debug(
        f"field_id:concept_id for all existing fields in active SRs with concepts: "
        f"{existing_field_id_to_concept_map}"
    )

    # get details of existing selected fields, for the purpose of matching against
    # new fields
    existing_field_ids = {item["object_id"] for item in existing_field_concepts}
    existing_fields = get_scan_report_fields(existing_field_ids)
    logger.debug(
        f"ids and names of existing fields with concepts in active SRs:"
        f" {existing_fields}"
    )

    # Combine everything of the existing fields to get this list, one for each
    # existing SRField with a SRConcept in an active SR.
    existing_mappings_to_consider = [
        {
            "name": field["name"],
            "concept": existing_field_id_to_concept_map[str(field["id"])],
            "id": field["id"],
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
        content_type,
    ):
        post_scan_report_concepts(concepts_to_post)
        logger.info("POST concepts all finished in reuse_existing_field_concepts")


def select_concepts_to_post(
    new_content_details: List[Dict[str, str]],
    details_to_id_and_concept_id_map: List[Dict[str, str]],
    content_type: Literal[15, 17],
) -> List[Dict[str, Any]]:
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

        content_type (Literal[15, 17]): Controls whether to handle fields (15), or values (17).

    Returns:
        A list of reused `Concepts` to create.

    Raises:
        Exception:  ValueError: A content_type other than 15 or 17 was provided.
    """
    concepts_to_post = []

    for new_content_detail in new_content_details:
        if content_type == 15:
            key = str(new_content_detail["name"])
        elif content_type == 17:
            key = (
                str(new_content_detail["name"]),
                str(new_content_detail["description"]),
                str(new_content_detail["field_name"]),
            )
        else:
            raise ValueError(f"Unsupported content_type: {content_type}")

        try:
            existing_content_id, concept_id = details_to_id_and_concept_id_map[key]
            logger.info(
                f"Found existing {'field' if content_type == 15 else 'value'} with id: {existing_content_id} "
                f"with existing concept mapping: {concept_id} which matches new {'field' if content_type == 15 else 'value'} id: {new_content_detail['id']}"
            )
            # Create ScanReportConcept entry for copying over the concept
            concept_entry = create_concept(
                concept_id, str(new_content_detail["id"]), content_type, "R"
            )
            concepts_to_post.append(concept_entry)
        except KeyError:
            continue

    return concepts_to_post
