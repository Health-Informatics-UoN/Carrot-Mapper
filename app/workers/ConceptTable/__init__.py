import asyncio
from collections import defaultdict
from typing import Any, Dict, List, Literal, Optional

import azure.functions as func
from shared_code import blob_parser, helpers, omop_helpers
from shared_code.api import (
    get_concept_vocabs,
    get_scan_report_active_concepts,
    get_scan_report_fields_by_ids,
    get_scan_report_fields_by_table,
    get_scan_report_table,
    get_scan_report_values,
    get_scan_report_values_filter_scan_report_table,
    post_chunks,
    post_scan_report_concepts,
)
from shared_code.logger import logger


def _create_concept(
    concept_id: str,
    object_id: str,
    content_type: Literal[15, 17] = 17,
    creation_type: Literal["V", "R"] = "V",
) -> Dict[str, Any]:
    """
    Creates a new Concept dict.

    Args:
        concept_id (str): The Id of the Concept to create.
        object_id (str): The Object Id of the Concept to create.
        content_type (Literal[15, 17], optional): The Content Type Id of the Concept.
        creation_type (Literal["R", "V"], optional): The Creation Type value of the Concept.

    Returns:
        Dict[str, Any]: A Concept as a dictionary.

    TODO: we should query `content_type` from the API, when this is fixed:
    https://github.com/Health-Informatics-UoN/CaRROT-Mapper/issues/637
    """
    return {
        "concept": concept_id,
        "object_id": object_id,
        "content_type": content_type,
        "creation_type": creation_type,
    }


def _create_concepts(table_values: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generate Concept entries ready for POSTing from a list of values.

    Args:
        table_values (List[Dict[str, Any]]): List of values to create concepts from.

    Returns:
        List[Dict[str, Any]]: List of Concept dictionaries.
    """
    concept_id_data = []
    for concept in table_values:
        if concept["concept_id"] != -1:
            if isinstance(concept["concept_id"], list):
                concept_id_data.extend(
                    _create_concept(concept_id, concept["id"])
                    for concept_id in concept["concept_id"]
                )
            else:
                concept_id_data.append(
                    _create_concept(concept["concept_id"], concept["id"])
                )

    return concept_id_data


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
            concept_entry = _create_concept(
                concept_id, str(new_content_detail["id"]), content_type, "R"
            )
            concepts_to_post.append(concept_entry)
        except KeyError:
            continue

    return concepts_to_post


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
    existing_fields = get_scan_report_fields_by_ids(existing_field_ids)
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
    existing_fields = get_scan_report_fields_by_ids(existing_field_ids)
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
    new_fields = get_scan_report_fields_by_ids(new_field_ids)
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


def _handle_concepts(
    entries_grouped_by_vocab: defaultdict[str, List[Dict[str, Any]]]
) -> None:
    """
    For each vocab, set "concept_id" and "standard_concept" in each entry in the vocab.
    Transforms the defaultdict inplace.

    For the case when vocab is None, set it to defaults.
    TODO: Could do with splitting this out into smaller functions also.

    For other cases, get the concepts from the vocab via /omop/conceptsfilter under
    pagination.
    Then match these back to the originating values, setting "concept_id" and
    "standard_concept" in each case.
    Finally, we need to fix all entries where "standard_concept" != "S" using
    `find_standard_concept_batch()`. This may result in more than one standard
    concept for a single nonstandard concept, and so "concept_id" may be either an
    int or str, or a list of such.

    Args:
        entries_grouped_by_vocab: (defaultdict[str, List[Dict[str, Any]]]): Entries grouped by Vocab.

    Returns:
        None
    """
    for vocab, value in entries_grouped_by_vocab.items():
        if vocab is None:
            # set to defaults, and skip all the remaining processing that a vocab
            # would require
            for entry in value:
                entry["concept_id"] = -1
                entry["standard_concept"] = None
            continue

        assert vocab is not None
        logger.info(f"begin {vocab}")

        paginated_values_in_this_vocab = helpers.paginate(
            (str(entry["value"]) for entry in entries_grouped_by_vocab[vocab]),
            max_chars=omop_helpers.max_chars_for_get,
        )

        concept_vocab_response = []

        for page_of_values in paginated_values_in_this_vocab:
            page_of_values_to_get = ",".join(map(str, page_of_values))

            concept_vocab = get_concept_vocabs(vocab, page_of_values_to_get)
            concept_vocab_response.append(concept_vocab)

        concept_vocab_content = helpers.flatten(concept_vocab_response)

        # Loop over all returned concepts, and match their concept_code and vocabulary_id with
        # the full_value in the entries_split_by_vocab, and set the latter's
        # concept_id and standard_concept with those values
        logger.debug(
            f"Attempting to match {len(concept_vocab_content)} concepts to "
            f"{len(entries_grouped_by_vocab[vocab])} SRValues"
        )
        for entry in entries_grouped_by_vocab[vocab]:
            entry["concept_id"] = -1
            entry["standard_concept"] = None

        for entry in entries_grouped_by_vocab[vocab]:
            for returned_concept in concept_vocab_content:
                if str(entry["value"]) == str(returned_concept["concept_code"]):
                    entry["concept_id"] = str(returned_concept["concept_id"])
                    entry["standard_concept"] = str(
                        returned_concept["standard_concept"]
                    )
                    # exit inner loop early if we find a concept for this entry
                    break

        logger.debug("finished matching")

        # ------------------------------------------------
        # Identify which concepts are non-standard, and get their standard counterparts
        # in a batch call
        entries_to_find_standard_concept = list(
            filter(
                lambda x: x["concept_id"] != -1 and x["standard_concept"] != "S",
                entries_grouped_by_vocab[vocab],
            )
        )
        logger.debug(
            f"finished selecting nonstandard concepts - selected "
            f"{len(entries_to_find_standard_concept)}"
        )

        batched_standard_concepts_map = omop_helpers.find_standard_concept_batch(
            entries_to_find_standard_concept
        )

        # batched_standard_concepts_map maps from an original concept id to
        # a list of associated standard concepts. Use each item to update the
        # relevant entry from entries_split_by_vocab[vocab].
        for nonstandard_concept in batched_standard_concepts_map:
            relevant_entry = helpers.get_by_concept_id(
                entries_grouped_by_vocab[vocab], nonstandard_concept
            )

            if isinstance(relevant_entry["concept_id"], (int, str)):
                relevant_entry["concept_id"] = batched_standard_concepts_map[
                    nonstandard_concept
                ]
            elif relevant_entry["concept_id"] is None:
                # This is the case where pairs_for_use contains an entry that
                # doesn't have a counterpart in entries_split_by_vocab, so this
                # should error or warn
                raise RuntimeWarning


async def _handle_table(
    table: Dict[str, Any], vocab: Dict[str, Dict[str, str]]
) -> None:
    """
    Handles Concept Creation on a table.

    Remarks:
        Works by transforming table_values, then generating concepts from them.

    Args:
        table (Dict[str, Any]): Table object to create for.
        vocab (Dict[str, Dict[str, str]]): Vocab dictionary.

    Returns:
        None
    """
    table_values = get_scan_report_values_filter_scan_report_table(table["id"])

    table_fields = get_scan_report_fields_by_table(table["id"])

    # Add vocab id to each entry from the vocab dict
    helpers.add_vocabulary_id_to_entries(
        table_values, vocab, table_fields, table["name"]
    )

    # group table_values by their vocabulary_id, for example:
    # ['LOINC': [ {'id': 512, 'value': '46457-8', ... 'vocabulary_id': 'LOINC' }]],
    entries_grouped_by_vocab = defaultdict(list)
    for entry in table_values:
        entries_grouped_by_vocab[entry["vocabulary_id"]].append(entry)

    _handle_concepts(entries_grouped_by_vocab)
    logger.debug("finished standard concepts lookup")
    # Remember that entries_grouped_by_vocab is just a view into table values
    # so changes to entries_grouped_by_vocab above are reflected when we access table_values.
    concepts = _create_concepts(table_values)

    # Chunk the SRConcept data ready for upload, and then upload via the endpoint.
    logger.info(f"POST {len(concepts)} concepts to table {table['name']}")

    chunked_concept_id_data = helpers.perform_chunking(concepts)
    logger.debug(f"chunked concepts list len: {len(chunked_concept_id_data)}")

    await post_chunks(
        chunked_concept_id_data,
        "scanreportconcepts",
        "concept",
        table_name=table["name"],
        scan_report_id=table["scan_report"],
    )

    logger.info("POST concepts all finished")

    # handle reuse of concepts
    reuse_existing_field_concepts(table_fields, 15)
    reuse_existing_value_concepts(table_values, 17)


def main(msg: func.QueueMessage):
    """
    Processes a queue message.
    Unwraps the message content
    Gets the vocab_dictionary
    Creates concepts...
    """
    _, data_dictionary_blob, _, table_id = helpers.unwrap_message(msg)

    # get the table
    table = get_scan_report_table(table_id)
    # table:
    # {'id': 22, 'created_at': '2024-02-14T17:18:06.599126Z',
    # 'updated_at': '2024-02-20T15:24:28.681054Z', 'name': 'Covid19.csv',
    # 'scan_report': 24, 'person_id': 68, 'date_event': 69}

    # get the vocab dictionary
    _, vocab_dictionary = blob_parser.get_data_dictionary(data_dictionary_blob)
    # vocab dict:
    # {'Covid19.csv': {'Symptom': 'SNOMED', 'Testtype': 'LOINC'}}

    asyncio.run(_handle_table(table, vocab_dictionary))

    return
