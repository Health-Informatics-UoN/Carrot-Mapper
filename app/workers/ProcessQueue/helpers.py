import json
import os

import requests

# Set up ccom API parameters:
API_URL = os.environ.get("APP_URL") + "api/"
HEADERS = {
    "Content-type": "application/json",
    "charset": "utf-8",
    "Authorization": f"Token {os.environ.get('AZ_FUNCTION_KEY')}",
}


def process_failure(scan_report_id):
    scan_report_fetched_data = requests.get(
        url=f"{API_URL}scanreports/{scan_report_id}/",
        headers=HEADERS,
    )

    scan_report_fetched_data = scan_report_fetched_data.json()

    json_data = json.dumps({"status": "UPFAILE"})

    failure_response = requests.patch(
        url=f"{API_URL}scanreports/{scan_report_id}/", data=json_data, headers=HEADERS
    )


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
    return round(value if value else 0.0, 2)


def handle_max_chars(max_chars=None):
    if not max_chars:
        max_chars = (
            int(os.environ.get("PAGE_MAX_CHARS"))
            if os.environ.get("PAGE_MAX_CHARS")
            else 10000
        )
    return max_chars


def perform_chunking(entries_to_post):
    """
    This expects a list of dicts, and returns a list of lists of lists of dicts,
    where the maximum length of each list of dicts, under JSONification,
    is less than max_chars, and the length of each list of lists of dicts is chunk_size
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


def paginate(entries, max_chars=None):
    """
    This expects a list of strings, and returns a list of lists of strings,
    where the maximum length of each list of strings, under JSONification,
    is less than max_chars
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
