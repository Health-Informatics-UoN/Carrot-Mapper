import json
import os
from typing import Any, Dict, List, Optional, Tuple

import azure.functions as func

# from shared_code.api import ScanReportStatus, update_scan_report_status
from shared_code.logger import logger


def unwrap_message(msg: func.QueueMessage) -> Tuple[str, str, str, str]:
    """
    Unwraps a queue message for further processing.

    Args:
        msg (func.QueueMessage): The message received from the queue.

    Returns:
        Tuple[str, str, str]: A tuple containing the extracted:
            - The blob containing the scan report.
            - The blob containing the data dictionary.
            - The ID of the scan report.
            - The ID of the scan report table.

    Raises:
        Exception: If the dequeue count of the message exceeds 1.
    """
    logger.info("Python queue trigger function processed a queue item.")
    message = _unwrap_message_body(msg)
    scan_report_blob, data_dictionary_blob, scan_report_id, table_id = _extract_details(
        message
    )
    _handle_failure(msg, scan_report_id)
    return scan_report_blob, data_dictionary_blob, scan_report_id, table_id


def _unwrap_message_body(msg: func.QueueMessage) -> dict:
    """
    Unwraps the queue message to extract its body.

    Args:
        msg (func.QueueMessage): The message received from the queue.

    Returns:
        dict: The unwrapped message body.
    """
    message_body = msg.get_body().decode("utf-8")
    logger.info(f"message body: {message_body}")
    return json.loads(message_body)


def _extract_details(message: dict) -> Tuple[str, str, str, str]:
    """
    Extracts details from a unwrapped message.

    Args:
        message (dict): The unwrapped message body.

    Returns:
        Tuple[str, str, str]: A tuple containing the extracted:
            - The blob containing the scan report.
            - The blob containing the data dictionary.
            - The ID of the scan report.
            - The ID of the scan report table.
    """
    scan_report_blob = message.get("scan_report_blob", "")
    data_dictionary_blob = message.get("data_dictionary_blob", "")
    scan_report_id = message.get("scan_report_id", "")
    table_id = message.get("table_id", "")

    return scan_report_blob, data_dictionary_blob, scan_report_id, table_id


def _handle_failure(msg: func.QueueMessage, scan_report_id: str) -> None:
    """
    Handles failure scenarios where the message has been dequeued more than once.

    Args:
        msg (func.QueueMessage): The message received from the queue.
        scan_report_id (str): The ID of the scan report.

    Raises:
        ValueError: If the dequeue count of the message exceeds 1.
    """
    logger.info(f"dequeue_count {msg.dequeue_count}")
    # if msg.dequeue_count == 2:
    # update_scan_report_status(scan_report_id, ScanReportStatus.UPLOAD_FAILED)
    if msg.dequeue_count > 1:
        raise ValueError("dequeue_count > 1")


def flatten(arr):
    """
    This expects a list of lists and returns a flattened list
    """
    return [item for sublist in arr for item in sublist]


def default_zero(value):
    """
    Helper function that returns the input, replacing anything Falsey
    (such as Nones or empty strings) with 0.0.
    """
    return round(value or 0.0, 2)


def handle_max_chars(max_chars: Optional[int] = None):
    if not max_chars:
        max_chars = (
            int(os.environ.get("PAGE_MAX_CHARS"))
            if os.environ.get("PAGE_MAX_CHARS")
            else 10000
        )
    return max_chars


def perform_chunking(entries_to_post: List[Dict]) -> List[List[Dict]]:
    """
    Splits a list of dictionaries into chunks.

    Args:
        entries_to_post (List[Dict]): A list of dictionaries to be chunked.

    Returns:
        List[List[Dict]]: A list of chunks, where each chunk is a list of dictionaries.

    This function splits the input list of dictionaries into smaller chunks based on the following criteria:
    - Each chunk's combined JSON representation should not exceed the specified maximum character limit (`max_chars`).
    - Each chunk should contain a maximum number of entries determined by the `chunk_size`.

    If the total JSON representation of entries in a chunk exceeds `max_chars`, the chunk is split into multiple chunks.
    The size of each chunk is capped at `chunk_size`. If the total number of entries exceeds `chunk_size`, multiple chunks are created.

    Config:
    - `max_chars`: Maximum JSON character length for each chunk. 'MAX_CHARS' environment variable.
    - `chunk_size`: Maximum entries allowed in each chunk. 'CHUNK_SIZE' environment variable.

    """
    max_chars = handle_max_chars()
    chunk_size = (
        int(os.environ.get("CHUNK_SIZE")) if os.environ.get("CHUNK_SIZE") else 6
    )

    chunked_entries_to_post = []
    this_page = []
    this_chunk = []
    page_no = 0
    for entry in entries_to_post:
        # If the current page won't be overfull, add the entry to the current page
        if len(json.dumps(this_page)) + len(json.dumps(entry)) < max_chars:
            this_page.append(entry)
        # Otherwise, this page should be added to the current chunk.
        else:
            this_chunk.append(this_page)
            page_no += 1
            # Now check for a full chunk. If full, then add this chunk to the list
            # of chunks.
            if page_no % chunk_size == 0:
                # append the chunk to the list of chunks, then reset the chunk to empty
                chunked_entries_to_post.append(this_chunk)
                this_chunk = []
            # Now add the entry that would have over-filled the page.
            this_page = [entry]
    # After all entries are added, check for a half-filled page, and if present add
    # it to the list of pages
    if this_page:
        this_chunk.append(this_page)
    # Similarly, if a chunk ends up half-filled, add it to thelist of chunks
    if this_chunk:
        chunked_entries_to_post.append(this_chunk)

    return chunked_entries_to_post


def paginate(entries: List[str], max_chars: Optional[int] = None) -> List[List[str]]:
    """
    This expects a list of strings, and returns a list of lists of strings,
    where the maximum length of each list of strings, under JSONification,
    is less than max_chars.

    Args:
        entries (List[str]): List of strings to paginate.
        max_chars (Optional[int]): Max length, if not provided will be read from environment.

    Returns:
        List[List[str]]: A list of paginated entries.
    """
    max_chars = handle_max_chars(max_chars)

    paginated_entries = []
    this_page = []
    for entry in entries:
        # If the current page won't be overfull, add the entry to the current page
        if len(json.dumps(this_page)) + len(json.dumps(entry)) < max_chars:
            this_page.append(entry)
        else:
            # Otherwise, this page should be added to the list of pages.
            paginated_entries.append(this_page)
            # Now add the entry that would have over-filled the page.
            this_page = [entry]

    # After all entries are added, check for a half-filled page, and if present add
    # it to the list of pages
    if this_page:
        paginated_entries.append(this_page)

    return paginated_entries


def get_by_concept_id(list_of_dicts: list, concept_id: str):
    """
    Given a list of dicts, return the dict from the list which
    contains the concept_id supplied
    """
    for item in list_of_dicts:
        if str(item["concept_id"]) == str(concept_id):
            return item
    return None


def add_vocabulary_id_to_entries(
    posted_values: List[Dict[str, Any]],
    vocab: Dict[str, Any],
    fieldids_to_names: Dict[str, str],
    table_name: str,
):
    """
    Add vocabulary_id to each entry from the vocab dictionary, defaulting to None if
    either there is no vocab dictionary provided, or non vocabs associated to the given field.

    Transforms the dictionary in place.

    Args:
        posted_values (list[dict]): List of dictionaries of previously posted values.
        vocab (Dict[str, Any]): Dict mapping table names to dictionaries of field names and vocab IDs.
        fieldids_to_names (Dict[str, str]): Dict mapping field IDs to field names.
        table_name (str): The current table name.

    Returns:
        None
    """
    for previously_posted_value in posted_values:
        vocab_id = None
        if vocab and vocab.get(table_name):
            if field_name := fieldids_to_names.get(
                str(previously_posted_value.get("scan_report_field"))
            ):
                vocab_id = vocab[table_name].get(field_name)
        previously_posted_value["vocabulary_id"] = vocab_id
