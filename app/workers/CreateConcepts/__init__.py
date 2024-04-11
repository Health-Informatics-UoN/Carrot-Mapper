import asyncio
import os
from collections import defaultdict
from typing import Any, Dict, List

import azure.functions as func
from shared.services.azurequeue import add_message
from shared_code import blob_parser, helpers, omop_helpers
from shared_code.api import (
    get_concept_vocabs,
    get_scan_report_fields_by_table,
    get_scan_report_table,
    get_scan_report_values_filter_scan_report_table,
    post_chunks,
)
from shared_code.logger import logger

from .reuse import reuse_existing_field_concepts, reuse_existing_value_concepts


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
                    helpers.create_concept(concept_id, concept["id"], "scanreportvalue")
                    for concept_id in concept["concept_id"]
                )
            else:
                concept_id_data.append(
                    helpers.create_concept(
                        concept["concept_id"], concept["id"], "scanreportvalue"
                    )
                )

    return concept_id_data


def _handle_concepts(
    entries_grouped_by_vocab: defaultdict[str, List[Dict[str, Any]]]
) -> None:
    """
    For each vocab, set "concept_id" and "standard_concept" in each entry in the vocab.
    Transforms the defaultdict inplace.

    For the case when vocab is None, set it to defaults.

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
            # Set to defaults, and skip all the remaining processing that a vocab would require
            _set_defaults_for_none_vocab(value)
        else:
            _process_concepts_for_vocab(vocab, value)


def _set_defaults_for_none_vocab(entries: List[Dict[str, Any]]) -> None:
    """
    Set default values for entries with none vocabulary.

    Args:
        entries (List[Dict[str, Any]]): A list of dictionaries representing the entries.

    Returns:
        None

    """
    for entry in entries:
        entry["concept_id"] = -1
        entry["standard_concept"] = None


def _process_concepts_for_vocab(vocab: str, entries: List[Dict[str, Any]]) -> None:
    """
    Process concepts for a specific vocabulary.

    Args:
        vocab (str): The vocabulary to process concepts for.
        entries (List[Dict[str, Any]]): A list of dictionaries representing the entries.

    Returns:
        None

    """
    logger.info(f"begin {vocab}")
    paginated_values = _paginate_values(entries)
    concept_vocab_content = _fetch_concepts_for_vocab(vocab, paginated_values)

    logger.debug(
        f"Attempting to match {len(concept_vocab_content)} concepts to "
        f"{len(entries)} SRValues"
    )
    _match_concepts_to_entries(entries, concept_vocab_content)
    logger.debug("finished matching")
    _batch_process_non_standard_concepts(entries)


def _paginate_values(entries: List[Dict[str, Any]]) -> List[List[str]]:
    """
    Paginate values for processing.

    Args:
        entries (List[Dict[str, Any]]): A list of dictionaries representing the entries.

    Returns:
        List[List[str]]: A paginated list of values.

    """
    values = [str(entry["value"]) for entry in entries]
    return helpers.paginate(values, max_chars=omop_helpers.max_chars_for_get)


def _fetch_concepts_for_vocab(
    vocab: str, paginated_values: List[List[str]]
) -> List[Dict[str, Any]]:
    """
    Fetch concepts for a specific vocabulary.

    Args:
        vocab (str): The vocabulary to fetch concepts for.
        paginated_values (List[List[str]]): A paginated list of values.

    Returns:
        List[Dict[str, Any]]: A list of dictionaries representing the fetched concepts.

    """
    concept_vocab_response = [
        get_concept_vocabs(vocab, ",".join(page_of_values))
        for page_of_values in paginated_values
    ]
    return helpers.flatten_list(concept_vocab_response)


def _match_concepts_to_entries(
    entries: List[Dict[str, Any]], concept_vocab_content: List[Dict[str, Any]]
) -> None:
    """
    Match concepts to entries.

    Remarks:
        Loop over all returned concepts, and match their concept_code and vocabulary_id with
        the full_value in the entries, and set the latter's
        concept_id and standard_concept with those values

    Args:
        entries (List[Dict[str, Any]]): A list of dictionaries representing the entries.
        concept_vocab_content (List[Dict[str, Any]]): A list of dictionaries representing the concept vocabulary content.

    Returns:
        None

    """
    for entry in entries:
        entry["concept_id"] = -1
        entry["standard_concept"] = None
        for returned_concept in concept_vocab_content:
            if str(entry["value"]) == str(returned_concept["concept_code"]):
                entry["concept_id"] = str(returned_concept["concept_id"])
                entry["standard_concept"] = str(returned_concept["standard_concept"])
                # exit inner loop early if we find a concept for this entry
                break


def _batch_process_non_standard_concepts(entries: List[Dict[str, Any]]) -> None:
    """
    Batch process non-standard concepts.

    Args:
        entries (List[Dict[str, Any]]): A list of dictionaries representing the entries.

    Returns:
        None
    """
    nonstandard_entries = [
        entry
        for entry in entries
        if entry["concept_id"] != -1 and entry["standard_concept"] != "S"
    ]
    logger.debug(
        f"finished selecting nonstandard concepts - selected "
        f"{len(nonstandard_entries)}"
    )
    batched_standard_concepts_map = omop_helpers.find_standard_concept_batch(
        nonstandard_entries
    )
    _update_entries_with_standard_concepts(entries, batched_standard_concepts_map)


def _update_entries_with_standard_concepts(
    entries: List[Dict[str, Any]], standard_concepts_map: Dict[str, Any]
) -> None:
    """
    Update entries with standard concepts.

    Remarks:
        batched_standard_concepts_map maps from an original concept id to
        a list of associated standard concepts. Use each item to update the
        relevant entry from entries[vocab].

    Args:
        entries (List[Dict[str, Any]]): A list of dictionaries representing the entries.
        standard_concepts_map (Dict[str, Any]): A dictionary mapping non-standard concepts to standard concepts.

    Returns:
        None

    Raises:
        RuntimeWarning: If the relevant entry's concept ID is None.
    """
    for nonstandard_concept, standard_concepts in standard_concepts_map.items():
        relevant_entry = helpers.get_by_concept_id(entries, nonstandard_concept)
        if relevant_entry is None:
            """
            This is the case where pairs_for_use contains an entry that
            doesn't have a counterpart in entries, so this
            should error or warn
            """
            raise RuntimeWarning
        elif isinstance(relevant_entry["concept_id"], (int, str)):
            relevant_entry["concept_id"] = standard_concepts


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
    reuse_existing_field_concepts(table_fields)
    reuse_existing_value_concepts(table_values)


def main(msg: func.QueueMessage):
    """
    Processes a queue message.
    Unwraps the message content
    Gets the vocab_dictionary
    Runs the create concepts processes.

    Args:
        msg (func.QueueMessage): The message received from the queue.
    """
    _, data_dictionary_blob, _, table_id = helpers.unwrap_message(msg)

    # get the table
    table = get_scan_report_table(table_id)

    # get the vocab dictionary
    _, vocab_dictionary = blob_parser.get_data_dictionary(data_dictionary_blob)

    asyncio.run(_handle_table(table, vocab_dictionary))

    # send to MappingRules queue
    message = {
        "table_id": table_id,
    }
    add_message(os.environ.get("MAPPING_RULES_QUEUE_NAME"), message)

    return
