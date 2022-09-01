import json
import logging
import os

from collections import defaultdict
from datetime import datetime

import asyncio
import httpx
import psutil
import requests
import azure.functions as func

from requests.models import HTTPError
from shared_code import omop_helpers
from . import helpers, blob_parser

# import memory_profiler
# root_logger = logging.getLogger()
# root_logger.handlers[0].setFormatter(logging.Formatter("%(name)s: %(message)s"))
# profiler_logstream = memory_profiler.LogFile('memory_profiler_logs', True)

logger = logging.getLogger("test_logger")

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(
    logging.Formatter(
        fmt="%(asctime)s - %(levelname)s - %(message)s", datefmt="%d/%m/%Y " "%H:%M:%S"
    )
)
logger.addHandler(stream_handler)
logger.setLevel(logging.INFO)  # Set to logging.DEBUG to show the debug output

max_chars_for_get = 2000

# Set up ccom API parameters:
API_URL = os.environ.get("APP_URL") + "api/"
HEADERS = {
    "Content-type": "application/json",
    "charset": "utf-8",
    "Authorization": f"Token {os.environ.get('AZ_FUNCTION_KEY')}",
}

# Look up vocabs from the omop.vocabulary table.
vocabs_raw = requests.get(
    url=f"{API_URL}omop/vocabularies/",
    headers=HEADERS,
)
vocabs = [vocab["vocabulary_id"] for vocab in vocabs_raw.json()]


def post_paginated_concepts(concepts_to_post):
    paginated_concepts_to_post = helpers.paginate(concepts_to_post)
    concept_response = []
    concept_response_content = []
    for concepts_to_post_item in paginated_concepts_to_post:
        post_concept_response = requests.post(
            url=f"{API_URL}scanreportconcepts/",
            headers=HEADERS,
            data=json.dumps(concepts_to_post_item),
        )
        logger.info(
            f"CONCEPTS SAVE STATUS >>> "
            f"{post_concept_response.status_code} "
            f"{post_concept_response.reason}"
        )
        concept_response.append(post_concept_response.json())
    concept_content = helpers.flatten(concept_response)

    concept_response_content += concept_content


async def post_chunks(chunked_data, endpoint, text_string, table_name, scan_report_id):
    response_content = []
    timeout = httpx.Timeout(60.0, connect=30.0)

    for chunk_no, chunk in enumerate(chunked_data):
        logger.debug(f"chunk {chunk_no}")
        async with httpx.AsyncClient(timeout=timeout) as client:
            tasks = []
            page_lengths = []
            for page_no, page in enumerate(chunk):
                logger.debug(f"chunk {chunk_no} page {page_no}")
                # POST chunked data to endpoint
                tasks.append(
                    asyncio.ensure_future(
                        client.post(
                            url=f"{API_URL}{endpoint}/",
                            data=json.dumps(page),
                            headers=HEADERS,
                        )
                    )
                )
                page_lengths.append(len(page))

            responses = await asyncio.gather(*tasks)
            logger.debug(f"{responses}")

        for response, page_length in zip(responses, page_lengths):
            logger.info(
                f"{text_string.upper()} SAVE STATUSES on {table_name} >>>"
                f" {response.status_code} "
                f"{response.reason_phrase} {page_length}"
            )

            if response.status_code != 201:
                helpers.process_failure(scan_report_id)
                raise HTTPError(
                    " ".join(
                        [
                            f"Error in {text_string.lower()} save:",
                            str(response.status_code),
                            str(response.reason_phrase),
                            str(response.json()),
                        ]
                    )
                )

            response_content += response.json()
    return response_content


def get_existing_fields_from_ids(existing_field_ids):
    paginated_existing_field_ids = helpers.paginate(
        existing_field_ids, max_chars_for_get
    )

    # for each list in paginated ids, get scanreport fields that match any of the given
    # ids (those with an associated concept)
    existing_fields = []
    for ids in paginated_existing_field_ids:
        ids_to_get = ",".join(map(str, ids))
        get_fields = requests.get(
            url=f"{API_URL}scanreportfields/?id__in={ids_to_get}&fields=id,name",
            headers=HEADERS,
        )
        existing_fields.append(get_fields.json())
    return helpers.flatten(existing_fields)


def select_concepts_to_post(
    new_content_details, details_to_id_and_concept_id_map, content_type
):
    """Depending on the content_type, generate a list concepts_to_post of
    ScanReportConcepts to be posted. Content_type controls whether this is handling
    fields or values. Fields have a key defined only by name, while values have a
    key defined by name, description, and field name.

    new_content_details is of type list, with each item in the list a dictionary
    containing either "id" and "name" keys (for fields) or "id", "name",
    "description", and "field_name" keys (for values).

    details_to_id_and_concept_id_map has keys "name" (for fields) or ("name",
    "description", "field_name") keys (for values), with entries (field_id,
    concept_id) or (value_id, concept_id) respectively.
    """
    concepts_to_post = []
    for new_content_detail in new_content_details:
        try:
            # fields
            if content_type == 15:
                (
                    existing_content_id,
                    concept_id,
                ) = details_to_id_and_concept_id_map[str(new_content_detail["name"])]
            # values
            elif content_type == 17:
                existing_content_id, concept_id = details_to_id_and_concept_id_map[
                    (
                        str(new_content_detail["name"]),
                        str(new_content_detail["description"]),
                        str(new_content_detail["field_name"]),
                    )
                ]
            else:
                raise RuntimeError(
                    f"content_type must be 15 or 17: you provided {content_type}"
                )

            new_content_id = str(new_content_detail["id"])
            if content_type == 15:
                logger.info(
                    f"Found existing field with id: {existing_content_id} with existing "
                    f"concept mapping: {concept_id} which matches new field id: "
                    f"{new_content_id}"
                )
            elif content_type == 17:
                logger.info(
                    f"Found existing value with id: {existing_content_id} with existing "
                    f"concept mapping: {concept_id} which matches new value id: "
                    f"{new_content_id}"
                )
            # Create ScanReportConcept entry for copying over the concept
            concept_entry = {
                "nlp_entity": None,
                "nlp_entity_type": None,
                "nlp_confidence": None,
                "nlp_vocabulary": None,
                "nlp_processed_string": None,
                "concept": concept_id,
                "object_id": new_content_id,
                "content_type": content_type,
                "creation_type": "R",
            }
            concepts_to_post.append(concept_entry)
        except KeyError:
            continue

    return concepts_to_post


def reuse_existing_field_concepts(new_fields_map, content_type):
    """
    This expects a dict of field names to ids which have been generated in a newly uploaded
    scanreport, and content_type 15. It creates new concepts associated to any
    field that matches the name of an existing field with an associated concept.
    """
    logger.info("reuse_existing_field_concepts")
    # Gets all scan report concepts that are for the type field
    # (or content type which should be field) and in "active" SRs
    get_field_concepts = requests.get(
        url=f"{API_URL}scanreportactiveconceptfilter/?content_type="
        f"{content_type}&fields=id,object_id,concept",
        headers=HEADERS,
    )
    existing_field_concepts = get_field_concepts.json()
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
    existing_fields = get_existing_fields_from_ids(existing_field_ids)
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
        {"name": name, "id": new_field_id}
        for name, new_field_id in new_fields_map.items()
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
        mappings_matching_field_name = [
            mapping
            for mapping in existing_mappings_to_consider
            if mapping["name"] == name
        ]
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
    concepts_to_post = select_concepts_to_post(
        new_fields_full_details,
        existing_field_name_to_field_and_concept_id_map,
        content_type,
    )

    if concepts_to_post:
        post_paginated_concepts(concepts_to_post)
        logger.info("POST concepts all finished in reuse_existing_field_concepts")


def reuse_existing_value_concepts(new_values_map, content_type):
    """
    This expects a dict of value names to ids which have been generated in a newly
    uploaded scanreport and creates new concepts if any matching names are found
    with existing fields
    """
    logger.info("reuse_existing_value_concepts")
    # Gets all scan report concepts that are for the type value
    # (or content type which should be value) and in "active" SRs
    get_value_concepts = requests.get(
        url=f"{API_URL}scanreportactiveconceptfilter/?content_type"
        f"={content_type}&fields=id,object_id,concept",
        headers=HEADERS,
    )
    existing_value_concepts = get_value_concepts.json()
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
        [value["object_id"] for value in existing_value_concepts], max_chars_for_get
    )
    logger.debug(f"{existing_paginated_value_ids=}")

    # for each list in paginated ids, get scanreport values that match any of the given
    # ids (those with an associated concept)
    existing_values_filtered_by_id = []
    for ids in existing_paginated_value_ids:
        ids_to_get = ",".join(map(str, ids))
        get_values = requests.get(
            url=f"{API_URL}scanreportvalues/?id__in={ids_to_get}&fields=id,value,scan_report_field,"
            f"value_description",
            headers=HEADERS,
        )
        existing_values_filtered_by_id.append(get_values.json())
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
    existing_fields = get_existing_fields_from_ids(existing_field_ids)
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
    new_paginated_field_ids = helpers.paginate(
        [value["scan_report_field"] for value in new_values_map], max_chars_for_get
    )
    logger.debug("new_paginated_field_ids")

    new_fields = []
    for ids in new_paginated_field_ids:
        ids_to_get = ",".join(map(str, ids))
        get_fields = requests.get(
            url=f"{API_URL}scanreportfields/?id__in={ids_to_get}&fields=id,name",
            headers=HEADERS,
        )
        new_fields.append(get_fields.json())
    new_fields = helpers.flatten(new_fields)
    logger.debug(f"fields of newly generated values: {new_fields}")

    new_fields_to_name_map = {str(field["id"]): field["name"] for field in new_fields}
    # logger.debug(
    #     f"id:name of fields of newly generated values: " f"{new_fields_to_name_map}"
    # )

    new_values_full_details = [
        {
            "name": value["value"],
            "description": value["value_description"],
            "field_name": new_fields_to_name_map[str(value["scan_report_field"])],
            "id": value["id"],
        }
        for value in new_values_map
    ]
    # logger.debug(
    #     f"name, desc, field_name, id of newly-generated values: "
    #     f"{new_values_full_details}",
    # )

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
        mappings_matching_value_name = [
            mapping
            for mapping in existing_mappings_to_consider
            if mapping["name"] == name
            and mapping["description"] == description
            and mapping["field_name"] == field_name
        ]
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
    concepts_to_post = select_concepts_to_post(
        new_values_full_details, value_details_to_value_and_concept_id_map, content_type
    )

    if concepts_to_post:
        post_paginated_concepts(concepts_to_post)
        logger.info("POST concepts all finished in reuse_existing_value_concepts")


# @memory_profiler.profile(stream=profiler_logstream)
def process_scan_report_sheet_table(sheet):
    """
    This function extracts the
    data into the format below.

    -- Example Table Sheet CSV --
    a,   frequency,          b, frequency
    apple,      20,     orange,         5
    banana,      3,   plantain,        50
    pear,       12,         '',        ''

    --

    -- output --
    dict({'a': [('apple', 20),
                ('banana', 3),
                ('pear', 12)],
          'b': [('orange', 5),
                ('plantain', 50)]
          }
         )
    """
    logger.debug("Start process_scan_report_sheet_table")

    sheet.reset_dimensions()
    sheet.calculate_dimension(force=True)
    # Get header entries (skipping every second column which is just 'Frequency')
    # So sheet_headers = ['a', 'b']
    first_row = sheet[1]
    sheet_headers = [cell.value for cell in first_row[::2]]

    # Set up an empty defaultdict, and fill it with one entry per header (i.e. one
    # per column)
    # Append each entry's value with the tuple (value, frequency) so that we end up
    # with each entry containing one tuple per non-empty entry in the column.
    #
    # This will give us
    #
    # ordereddict({'a': [('apple', 20), ('banana', 3), ('pear', 12)],
    #              'b': [('orange', 5), ('plantain', 50)]})

    d = defaultdict(list)
    # Iterate over all rows beyond the header - use the number of sheet_headers*2 to
    # set the maximum column rather than relying on sheet.max_col as this is not
    # always reliably updated by Excel etc.
    for row in sheet.iter_rows(
        min_col=1,
        max_col=len(sheet_headers) * 2,
        min_row=2,
        max_row=sheet.max_row,
        values_only=True,
    ):
        # Set boolean to track whether we hit a blank row for early exit below.
        this_row_empty = True
        # Iterate across the pairs of cells in the row. If the pair is non-empty,
        # then add it to the relevant dict entry.
        for (header, cell, freq) in zip(sheet_headers, row[::2], row[1::2]):
            if (cell != "" and cell is not None) or (freq != "" and freq is not None):
                d[header].append((str(cell), freq))
                this_row_empty = False
        # This will trigger if we hit a row that is entirely empty. Short-circuit
        # to exit early here - this saves us from situations where sheet.max_row is
        # incorrectly set (too large)
        if this_row_empty:
            break

    logger.debug("Finish process_scan_report_sheet_table")
    return d


# @memory_profiler.profile(stream=profiler_logstream)
async def process_values_from_sheet(
    sheet,
    data_dictionary,
    vocab_dictionary,
    current_table_name,
    current_table_id,
    fieldnames_to_ids_dict,
    fieldids_to_names_dict,
    scan_report_id,
):
    # print("WORKING ON", sheet.title)
    # Reset list for values
    value_entries_to_post = []
    # Get (col_name, value, frequency) for each field in the table
    fieldname_value_freq_dict = process_scan_report_sheet_table(sheet)

    """
    For every result of process_scan_report_sheet_table, create an entry ready to be 
    POSTed. This includes adding in any 'value description' supplied in the data 
    dictionary.
    """
    values_details = []
    for fieldname, value_freq_tuples in fieldname_value_freq_dict.items():
        for full_value, frequency in value_freq_tuples:
            values_details.append(
                {
                    "full_value": full_value,
                    "frequency": frequency,
                    "fieldname": fieldname,
                    "table": current_table_name,
                    "val_desc": None,
                }
            )

    logger.debug("assign order")
    # Add "order" field to each entry to enable correctly-ordered recombination at the end
    for entry_number, entry in enumerate(values_details):
        entry["order"] = entry_number

    # --------------------------------------------------------------------------------
    # Update val_desc of each SRField entry if it has a value description from the
    # data dictionary

    if data_dictionary:
        logger.debug("apply data dictionary")
        for entry in values_details:
            if data_dictionary.get(str(entry["table"])):  # dict of fields in table
                if data_dictionary[str(entry["table"])].get(
                    str(entry["fieldname"])
                ):  # dict of values in field in table
                    entry["val_desc"] = data_dictionary[str(entry["table"])][
                        str(entry["fieldname"])
                    ].get(str(entry["full_value"]))

    # --------------------------------------------------------------------------------
    # Convert basic information about SRValues into entries for posting to the endpoint.
    logger.debug("create value_entries_to_post")
    value_entries_to_post = [
        {
            "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "value": entry["full_value"],
            "frequency": int(entry["frequency"]),
            "value_description": entry["val_desc"],
            "scan_report_field": fieldnames_to_ids_dict[entry["fieldname"]],
        }
        for entry in values_details
    ]

    # print(value_entries_to_post)

    # --------------------------------------------------------------------------------
    # Chunk the SRValues data ready for upload, and then upload via the endpoint.
    logger.info(
        f"POST {len(value_entries_to_post)} values to table {current_table_name}"
    )
    logger.debug(f"RAM memory % used: {psutil.virtual_memory()}")
    chunked_value_entries_to_post = helpers.perform_chunking(value_entries_to_post)
    logger.debug(f"chunked values list len: {len(chunked_value_entries_to_post)}")

    values_response_content = await post_chunks(
        chunked_value_entries_to_post,
        "scanreportvalues",
        "values",
        table_name=current_table_name,
        scan_report_id=scan_report_id,
    )
    logger.info("POST values all finished")
    logger.debug(f"RAM memory % used: {psutil.virtual_memory()}")

    # --------------------------------------------------------------------------------
    # Get the details of all the SRValues posted in this table. Then we will be able
    # to run them through the vocabulary mapper and apply any automatic vocab mappings.

    # GET values where the scan_report_table is the current table.
    logger.debug("GET posted values")
    get_details_of_posted_values = requests.get(
        url=f"{API_URL}scanreportvaluesfilterscanreporttable/?scan_report_table"
        f"={current_table_id}",
        headers=HEADERS,
    )
    logger.debug("GET posted values finished")

    details_of_posted_values = get_details_of_posted_values.json()

    # ---------------------------------------------------------------------------------
    # Process the SRValues, comparing their SRFields to the vocabs, and then create a
    # SRConcept entry if a valid translation is found.

    # ------------------------------------------------------------------------------
    # Add vocabulary_id to each entry from the vocab dictionary, defaulting to None
    if vocab_dictionary:
        logger.debug("apply vocab dictionary")
        for previously_posted_value in details_of_posted_values:
            if vocab_dictionary.get(str(current_table_name)):
                vocab_id = vocab_dictionary[str(current_table_name)].get(
                    str(
                        fieldids_to_names_dict[
                            str(previously_posted_value["scan_report_field"])
                        ]
                    )
                )  # dict of values, will default to None if field not found in table
            else:
                vocab_id = None

            previously_posted_value["vocabulary_id"] = vocab_id

    # print("vocab ids added:")
    # print(details_of_posted_values)

    # print(set(entry["vocabulary_id"] for entry in a))

    logger.debug("split by vocab")

    # ---------------------------------------------------------------------
    # Split up by each vocabulary_id, so that we can send the contents of each to the
    # endpoint in a separate call, with one vocabulary_id per call.
    entries_split_by_vocab = defaultdict(list)
    for entry in details_of_posted_values:
        entries_split_by_vocab[entry["vocabulary_id"]].append(entry)

    # print(entries_split_by_vocab)

    # for vocab in entries_split_by_vocab:
    #     print(vocab, entries_split_by_vocab[vocab])

    # ----------------------------------------------
    # For each vocab, set "concept_id" and "standard_concept" in each entry in the
    # vocab.
    #
    # For the case when vocab is None, set it to defaults.
    #
    # For other cases, get the concepts from the vocab via /omop/conceptsfilter under
    # pagination.
    # Then match these back to the originating values, setting "concept_id" and
    # "standard_concept" in each case.
    # Finally, we need to fix any entries where "standard_concept" != "S" using
    # `find_standard_concept()`
    # TODO: `find_standard_concept()` currently only works on a one-by-one basis

    for vocab in entries_split_by_vocab:
        # print()
        if vocab is None:
            for entry in entries_split_by_vocab[vocab]:
                entry["concept_id"] = -1
                entry["standard_concept"] = None
        else:
            assert vocab is not None
            logger.info(f"begin {vocab}")
            paginated_values_in_this_vocab = helpers.paginate(
                (str(entry["value"]) for entry in entries_split_by_vocab[vocab]),
                max_chars=max_chars_for_get,
            )

            concept_vocab_response = []
            # concept_vocab_response_content = []
            for page_of_values in paginated_values_in_this_vocab:
                # print(f"{concepts_to_get_item=}")
                get_concept_vocab_response = requests.get(
                    f"{API_URL}omop/conceptsfilter/?concept_code__in="
                    f"{','.join(page_of_values)}&vocabulary_id__in"
                    f"={vocab}",
                    headers=HEADERS,
                )
                logger.debug(
                    f"CONCEPTS GET BY VOCAB STATUS >>> "
                    f"{get_concept_vocab_response.status_code} "
                    f"{get_concept_vocab_response.reason}"
                )
                # print('response', get_concept_vocab_response.json())
                concept_vocab_response.append(get_concept_vocab_response.json())
            # print(f"{concept_vocab_response=}")
            concept_vocab_content = helpers.flatten(concept_vocab_response)

            # Loop over all returned concepts, and match their concept_code and vocabulary_id (
            # which is not necessary as we're within a single vocab's context anyway) with
            # the full_value in the entries_split_by_vocab, and extend the latter by
            # concept_id and standard_concept
            # print(f"{concept_vocab_content=}")
            logger.debug(
                f"begin double loop over {len(concept_vocab_content)} * "
                f"{len(entries_split_by_vocab[vocab])} pairs"
            )
            for entry in entries_split_by_vocab[vocab]:
                entry["concept_id"] = -1
                entry["standard_concept"] = None
            # TODO: consider any better way of doing this, but shortcircuiting with
            #  break seems sufficient - sub-1s for >600 values
            for entry in entries_split_by_vocab[vocab]:
                count = 0
                for returned_concept in concept_vocab_content:
                    # print("comparing", returned_concept, entry)
                    count += 1
                    if str(entry["value"]) == str(returned_concept["concept_code"]):
                        entry["concept_id"] = str(returned_concept["concept_id"])
                        entry["standard_concept"] = str(
                            returned_concept["standard_concept"]
                        )
                        # exit inner loop early if we find a concept for this entry
                        break

            logger.debug("finished double loop")

            # ------------------------------------------------
            # Identify which concepts are non-standard, and fix them
            entries_to_find_standard_concept = []
            for entry in entries_split_by_vocab[vocab]:
                if entry["concept_id"] != -1 and entry["standard_concept"] != "S":
                    entries_to_find_standard_concept.append(entry)
            logger.debug(
                f"finished selecting nonstandard concepts - selected "
                f"{len(entries_to_find_standard_concept)}"
            )

            batched_standard_concepts_map = omop_helpers.find_standard_concept_batch(
                entries_to_find_standard_concept
            )
            # logger.debug(f"{batched_standard_concepts_map=}")
            # Each item in pairs_for_use is a tuple. First item is original concept
            # id. Second item is the standard concept. Note that the first item is
            # not guaranteed to be unique: one concept may map to multiple standard
            # concepts.
            for nonstandard_concept in batched_standard_concepts_map:
                relevant_entry = helpers.get_by_concept_id(
                    entries_split_by_vocab[vocab], nonstandard_concept
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

            # logger.debug(f"{entries_split_by_vocab=}")
            logger.debug("finished standard concepts lookup")

    # ------------------------------------
    # All Concepts are now ready. Generate their entries ready for POSTing

    concept_id_data = []
    for concept in details_of_posted_values:
        if concept["concept_id"] != -1:
            if isinstance(concept["concept_id"], list):
                for concept_id in concept["concept_id"]:
                    concept_id_data.append(
                        {
                            "concept": concept_id,
                            "object_id": concept["id"],
                            # TODO: we should query this value from the API
                            # - via ORM it would be ContentType.objects.get(model='scanreportvalue').id,
                            # but that's not available from an Azure Function.
                            "content_type": 17,
                            "creation_type": "V",
                        }
                    )
            else:
                concept_id_data.append(
                    {
                        "concept": concept["concept_id"],
                        "object_id": concept["id"],
                        # TODO: we should query this value from the API
                        # - via ORM it would be ContentType.objects.get(model='scanreportvalue').id,
                        # but that's not available from an Azure Function.
                        "content_type": 17,
                        "creation_type": "V",
                    }
                )

    # --------------------------------------------------------------------------------
    # Chunk the SRConcept data ready for upload, and then upload via the endpoint.
    logger.info(f"POST {len(concept_id_data)} concepts to table {current_table_name}")

    chunked_concept_id_data = helpers.perform_chunking(concept_id_data)
    logger.debug(f"chunked concepts list len: {len(chunked_concept_id_data)}")

    await post_chunks(
            chunked_concept_id_data,
            "scanreportconcepts",
            "concept",
            table_name=current_table_name,
            scan_report_id=scan_report_id,
        )

    logger.info("POST concepts all finished")
    logger.debug(f"RAM memory % used: {psutil.virtual_memory()}")

    reuse_existing_field_concepts(fieldnames_to_ids_dict, 15)
    reuse_existing_value_concepts(values_response_content, 17)
    logger.debug(f"RAM memory % used: {psutil.virtual_memory()}")


def post_field_entries(field_entries_to_post, scan_report_id):
    paginated_field_entries_to_post = helpers.paginate(field_entries_to_post)
    fields_response_content = []
    # POST Fields
    for page in paginated_field_entries_to_post:
        fields_response = requests.post(
            url=f"{API_URL}scanreportfields/",
            data=json.dumps(page),
            headers=HEADERS,
        )
        # print('dumped:', json.dumps(page))
        logger.info(
            f"FIELDS SAVE STATUS >>> {fields_response.status_code} "
            f"{fields_response.reason} {len(page)}"
        )

        if fields_response.status_code != 201:
            helpers.process_failure(scan_report_id)
            raise HTTPError(
                " ".join(
                    [
                        "Error in fields save:",
                        str(fields_response.status_code),
                        str(json.dumps(page)),
                    ]
                )
            )

        fields_response_content += fields_response.json()

    logger.info("POST fields all finished")
    return fields_response_content


async def handle_single_table(
    current_table_name,
    current_table_id,
    field_entries_to_post,
    scan_report_id,
    wb,
    data_dictionary,
    vocab_dictionary,
):
    # This is the scenario where the line is empty, so we're at the end of
    # the table. Don't add a field entry, but process all those so far.
    # print("scan_report_field_entries >>>", field_entries_to_post)

    # POST fields in this table
    logger.info(
        f"POST {len(field_entries_to_post)} fields to table {current_table_name}"
    )
    logger.debug(f"RAM memory % used: {psutil.virtual_memory()}")

    fields_response_content = post_field_entries(field_entries_to_post, scan_report_id)

    # Create a dictionary with field names and field ids from the response
    # as key value pairs
    # e.g ("Field Name": Field ID)
    fieldnames_to_ids_dict = {
        str(element.get("name", None)): str(element.get("id", None))
        for element in fields_response_content
    }
    fieldids_to_names_dict = {
        str(element.get("id", None)): str(element.get("name", None))
        for element in fields_response_content
    }

    # print("Dictionary id:name", fieldnames_to_ids_dict)

    if current_table_name not in wb.sheetnames:
        helpers.process_failure(scan_report_id)
        raise ValueError(
            f"Attempting to access sheet '{current_table_name}'"
            f" in scan report, but no such sheet exists."
        )

    # Go to Table sheet to process all the values from the sheet
    sheet = wb[current_table_name]

    await process_values_from_sheet(
        sheet,
        data_dictionary,
        vocab_dictionary,
        current_table_name,
        current_table_id,
        fieldnames_to_ids_dict,
        fieldids_to_names_dict,
        scan_report_id,
    )


async def process_all_fields_and_values(
    fo_ws,
    table_name_to_id_map,
    wb,
    data_dictionary,
    vocab_dictionary,
    scan_report_id,
):
    """Loop over all rows in Field Overview sheet.
    This is the same as looping over all fields in all tables.
    When the end of one table is reached, then post all the ScanReportFields
    and ScanReportValues associated to that table, then continue down the
    list of fields in tables.
    """
    field_entries_to_post = []

    previous_row_value = None
    for row in fo_ws.iter_rows(min_row=2, max_row=fo_ws.max_row + 2):
        # Guard against unnecessary rows beyond the last true row with contents
        if (previous_row_value is None or previous_row_value == "") and (
            row[0].value is None or row[0].value == ""
        ):
            break
        previous_row_value = row[0].value

        # If the row is not empty, then it is a field in a table, and should be added to
        # the list ready for processing at the end of this table.
        if row[0].value != "" and row[0].value is not None:
            current_table_name = row[0].value
            # Create ScanReportField entry
            field_entry = {
                "scan_report_table": table_name_to_id_map[current_table_name],
                "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                "name": str(row[1].value),
                "description_column": str(row[2].value),
                "type_column": str(row[3].value),
                "max_length": row[4].value,
                "nrows": row[5].value,
                "nrows_checked": row[6].value,
                "fraction_empty": round(helpers.default_zero(row[7].value), 2),
                "nunique_values": row[8].value,
                "fraction_unique": round(helpers.default_zero(row[9].value), 2),
                "ignore_column": None,
            }
            # Append each entry to a list
            field_entries_to_post.append(field_entry)

        else:
            # This is the scenario where the line is empty, so we're at the end of
            # the table. Don't add a field entry, but process all those so far.
            # print("scan_report_field_entries >>>", field_entries_to_post)
            await handle_single_table(
                current_table_name,
                table_name_to_id_map[current_table_name],
                field_entries_to_post,
                scan_report_id,
                wb,
                data_dictionary,
                vocab_dictionary,
            )
            field_entries_to_post = []
    # Catch the final table if it wasn't already posted in the loop above - sometimes the iter_rows() seems to now allow you to go beyond the last row.
    if field_entries_to_post:
        await handle_single_table(
            current_table_name,
            table_name_to_id_map[current_table_name],
            field_entries_to_post,
            scan_report_id,
            wb,
            data_dictionary,
            vocab_dictionary,
        )


# @memory_profiler.profile(stream=profiler_logstream)
def post_tables(fo_ws, scan_report_id):
    # Get all the table names in the order they appear in the Field Overview page
    table_names = []
    # Iterate over cells in the first column, but because we're in ReadOnly mode we
    # can't do that in the simplest manner.
    fo_ws.reset_dimensions()
    fo_ws.calculate_dimension(force=True)
    for row in fo_ws.iter_rows(min_row=2, max_row=fo_ws.max_row):
        cell_value = row[0].value
        # Check value is both non-empty and not seen before
        if cell_value and cell_value not in table_names:
            table_names.append(cell_value)

    """
    For each table create a scan_report_table entry,
    Append entry to table_entries_to_post[] list,
    Create JSON array with all the entries,
    Send POST request to API with JSON as input,
    Save the response data(table IDs)
    """
    table_entries_to_post = []
    # print("Working on Scan Report >>>", scan_report_id)
    logger.debug(f"RAM memory % used: {psutil.virtual_memory()}")
    logger.info(f"TABLES NAMES >>> {table_names}")

    for table_name in table_names:
        # print("WORKING ON TABLE >>> ", table_name)

        # Truncate table names because sheet names are truncated to 31 characters in Excel
        short_table_name = table_name[:31]

        # Create ScanReportTable entry
        # Link to scan report using ID from the queue message
        table_entry = {
            "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "name": short_table_name,
            "scan_report": str(scan_report_id),
            "person_id": None,
            "birth_date": None,
            "measurement_date": None,
            "condition_date": None,
            "observation_date": None,
        }

        # print("SCAN REPORT TABLE ENTRY", table_entry)

        # Append to list
        table_entries_to_post.append(table_entry)

    logger.info("POST tables")
    # POST request to scanreporttables
    tables_response = requests.post(
        url=f"{API_URL}scanreporttables/",
        data=json.dumps(table_entries_to_post),
        headers=HEADERS,
    )

    logger.info("POST tables finished")

    logger.info(f"TABLE SAVE STATUS >>> {tables_response.status_code}")
    # Error on failure
    if tables_response.status_code != 201:
        helpers.process_failure(scan_report_id)
        raise HTTPError(
            " ".join(
                [
                    "Error in table save:",
                    str(tables_response.status_code),
                    str(json.dumps(table_entries_to_post)),
                ]
            )
        )
    logger.debug(f"RAM memory % used: {psutil.virtual_memory()}")

    # Load the result of the post request,
    tables_content = tables_response.json()

    # Save the table ids that were generated from the POST method
    table_ids = [element["id"] for element in tables_content]

    logger.info(f"TABLE IDs {table_ids}")
    table_name_to_id_map = dict(zip(table_names, table_ids))
    return table_name_to_id_map


# @memory_profiler.profile(stream=profiler_logstream)
def startup(msg):
    logger.info("Python queue trigger function processed a queue item.")
    logger.debug(f"RAM memory % used: {psutil.virtual_memory()}")

    # Get message from queue
    message = {
        "id": msg.id,
        "body": msg.get_body().decode("utf-8"),
        "expiration_time": (
            msg.expiration_time.isoformat() if msg.expiration_time else None
        ),
        "insertion_time": (
            msg.insertion_time.isoformat() if msg.insertion_time else None
        ),
        "time_next_visible": (
            msg.time_next_visible.isoformat() if msg.time_next_visible else None
        ),
        "pop_receipt": msg.pop_receipt,
        "dequeue_count": msg.dequeue_count,
    }

    logger.info(f"message: {message}")
    # Grab message body from storage queues,
    # extract filenames for scan reports and dictionaries
    # print("body 1:", type(message["body"]), message["body"])
    body = json.loads(message["body"])
    # print("body 2:", type(body), body)
    scan_report_blob = body["scan_report_blob"]
    data_dictionary_blob = body["data_dictionary_blob"]

    logger.info(f"MESSAGE BODY >>> {body}")

    # If the message has been dequeued for a second time, then the upload has failed.
    # Patch the name of the dataset to make it clear that it has failed,
    # set the status to 'Upload Failed', and then stop.
    logger.info(f"dequeue_count {msg.dequeue_count}")
    scan_report_id = body["scan_report_id"]
    if msg.dequeue_count == 2:
        helpers.process_failure(scan_report_id)

    if msg.dequeue_count > 1:
        raise Exception("dequeue_count > 1")

    # Otherwise, this must be the first time we've seen this message. Proceed.
    return scan_report_blob, data_dictionary_blob, scan_report_id


def main(msg: func.QueueMessage):
    scan_report_blob, data_dictionary_blob, scan_report_id = startup(msg)
    # Set the status to 'Upload in progress'
    status_in_progress_response = requests.patch(
        url=f"{API_URL}scanreports/{scan_report_id}/",
        data=json.dumps({"status": "UPINPRO"}),
        headers=HEADERS,
    )

    wb, data_dictionary, vocab_dictionary = blob_parser.parse_blobs(
        scan_report_blob, data_dictionary_blob
    )
    # Get the first sheet 'Field Overview',
    # to populate ScanReportTable & ScanReportField models
    fo_ws = wb.worksheets[0]

    # POST ScanReportTables
    table_name_to_id_map = post_tables(fo_ws, scan_report_id)

    """
    POST fields per table:
    For each row in Field Overview create an entry for scan_report_field,
    Empty row signifies end of fields in a table
    Append field entry to field_entries_to_post[] list,
    Create JSON array with all the field entries, 
    Send POST request to API with JSON as input,
    Save the response data(field ids,field names) in a dictionary
    Set the current working sheet to be the same as the current table
    Post the values for that table
    """

    logger.info("Start looping over all fields in all tables")
    # Loop over all rows in Field Overview sheet.
    # This is the same as looping over all fields in all tables.
    # When the end of one table is reached, then post all the ScanReportFields
    # and ScanReportValues associated to that table, then continue down the
    # list of fields in tables until all fields in all tables have been
    # processed (along with their ScanReportValues).
    asyncio.run(process_all_fields_and_values(
            fo_ws,
            table_name_to_id_map,
            wb,
            data_dictionary,
            vocab_dictionary,
            scan_report_id,
        )
    )

    logger.info("All tables completed. Now set status to 'Upload Complete'")
    # Set the status to 'Upload Complete'
    status_complete_response = requests.patch(
        url=f"{API_URL}scanreports/{scan_report_id}/",
        data=json.dumps({"status": "UPCOMPL"}),
        headers=HEADERS,
    )
    logger.info("Successfully set status to 'Upload Complete'")
    wb.close()
    logger.info("Workbook successfully closed")
