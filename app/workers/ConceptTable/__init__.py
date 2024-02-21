import asyncio
from collections import defaultdict
from typing import Any, Dict

import azure.functions as func
from shared_code import blob_parser, helpers, logger, omop_helpers
from shared_code.api import (
    get_concept_vocabs,
    get_scan_report_table,
    get_scan_report_values_filter_scan_report_table,
    post_chunks,
)


def _create_concept(concept: Dict[str, Any], concept_id: str) -> Dict[str, Any]:
    """
    Creates a concept.
    TODO: we should query `content_type` from the API
    - via ORM it would be ContentType.objects.get(model='scanreportvalue').id,
    but that's not available from an Azure Function.
    """
    return {
        "concept": concept_id,
        "object_id": concept["id"],
        "content_type": 17,
        "creation_type": "V",
    }


def _create_concepts(existing_values) -> None:
    """
    Creates concepts.
    All Concepts are now ready. Generate their entries ready for POSTing from
    details_of_posted_values. Remember that entries_split_by_vocab is just a view
    into this list, so changes to entries_split_by_vocab above are reflected when
    we access details_of_posted_values below.
    """
    concept_id_data = []
    for concept in existing_values:
        if concept["concept_id"] != -1:
            if isinstance(concept["concept_id"], list):
                concept_id_data.extend(
                    {
                        "concept": concept_id,
                        "object_id": concept["id"],
                        # TODO: we should query this value from the API
                        # - via ORM it would be ContentType.objects.get(model='scanreportvalue').id,
                        # but that's not available from an Azure Function.
                        "content_type": 17,
                        "creation_type": "V",
                    }
                    for concept_id in concept["concept_id"]
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
    return concept_id_data


def _handle_concepts(entries_split_by_vocab) -> None:
    """
    Handles concept creation?
     For each vocab, set "concept_id" and "standard_concept" in each entry in the
     vocab.

     For the case when vocab is None, set it to defaults.

     For other cases, get the concepts from the vocab via /omop/conceptsfilter under
     pagination.
     Then match these back to the originating values, setting "concept_id" and
     "standard_concept" in each case.
     Finally, we need to fix all entries where "standard_concept" != "S" using
     `find_standard_concept_batch()`. This may result in more than one standard
     concept for a single nonstandard concept, and so "concept_id" may be either an
     int or str, or a list of such.
    """
    for vocab, value in entries_split_by_vocab.items():
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
            (str(entry["value"]) for entry in entries_split_by_vocab[vocab]),
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
            f"{len(entries_split_by_vocab[vocab])} SRValues"
        )
        for entry in entries_split_by_vocab[vocab]:
            entry["concept_id"] = -1
            entry["standard_concept"] = None

        for entry in entries_split_by_vocab[vocab]:
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
                entries_split_by_vocab[vocab],
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


async def _handle_table(table: Dict[str, Any], vocab: Dict[Any, Any]) -> None:
    """
    Handles Concept Creation on a table.
    """
    # get values for that table?
    table_values = get_scan_report_values_filter_scan_report_table(table["id"])
    # Add vocab id to each entry from the vocab dict

    # TODO: Get this?
    fieldids_to_names_dict = []

    helpers.add_vocabulary_id_to_entries(
        table_values, vocab, fieldids_to_names_dict, table["name"]
    )

    entries_split_by_vocab = defaultdict(list)
    for entry in table_values:
        entries_split_by_vocab[entry["vocabulary_id"]].append(entry)

    _handle_concepts(entries_split_by_vocab)
    logger.debug("finished standard concepts lookup")
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

    # handle reuse existing stuff?


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

    # get the vocab dictionary
    _, vocab_dictionary = blob_parser.get_data_dictionary(data_dictionary_blob)

    _handle_table(table, vocab_dictionary)

    return
