import os
from collections import defaultdict
from itertools import islice
from typing import Any, Dict, List

from shared_code import blob_parser, helpers, omop_helpers
from shared_code.api import (
    get_concept_vocabs,
    get_scan_report_fields_by_table,
    get_scan_report_values_filter_scan_report_table,
)
from shared_code.logger import logger

from .reuse import reuse_existing_field_concepts, reuse_existing_value_concepts

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shared_code.django_settings")
import django

django.setup()

from shared.data.models import ScanReportConcept, ScanReportTable
from shared_code import db


def _create_concepts(table_values: List[Dict[str, Any]]) -> List[ScanReportConcept]:
    """
    Generate Concept entries ready for POSTing from a list of values.

    Args:
        table_values (List[Dict[str, Any]]): List of values to create concepts from.

    Returns:
        List[Dict[str, Any]]: List of Concept dictionaries.
    """
    concepts: List[ScanReportConcept] = []
    for concept in table_values:
        if concept["concept_id"] != -1:
            if isinstance(concept["concept_id"], list):
                concepts.extend(
                    db.create_concept(concept_id, concept["id"], "scanreportvalue")
                    for concept_id in concept["concept_id"]
                )
            else:
                concepts.append(
                    db.create_concept(
                        concept["concept_id"], concept["id"], "scanreportvalue"
                    )
                )

    return concepts


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


def _handle_table(table: ScanReportTable, vocab: Dict[str, Dict[str, str]]) -> None:
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
    # TODO: Replace with db
    table_values = get_scan_report_values_filter_scan_report_table(table.pk)
    table_fields = get_scan_report_fields_by_table(table.pk)

    # Add vocab id to each entry from the vocab dict
    helpers.add_vocabulary_id_to_entries(table_values, vocab, table_fields, table.name)

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

    # Bulk create Concepts in batches
    logger.info(f"Creating {len(concepts)} concepts for table {table.name}")

    batch_size = 1000
    while True:
        if batch := list(islice(concepts, batch_size)):
            ScanReportConcept.objects.bulk_create(batch, batch_size)
        else:
            break
    logger.info("Create concepts all finished")

    # handle reuse of concepts
    reuse_existing_field_concepts(table_fields)
    reuse_existing_value_concepts(table_values)


def main(msg: Dict[str, str]):
    """
    Processes a queue message.
    Unwraps the message content
    Gets the vocab_dictionary
    Runs the create concepts processes.

    Args:
        msg (Dict[str, str]): The message received from the orchestrator.
    """
    data_dictionary_blob = msg.pop("data_dictionary_blob")
    table_id = msg.pop("table_id")

    # get the table
    table = ScanReportTable.objects.get(pk=table_id)

    # get the vocab dictionary
    _, vocab_dictionary = blob_parser.get_data_dictionary(data_dictionary_blob)

    _handle_table(table, vocab_dictionary)
