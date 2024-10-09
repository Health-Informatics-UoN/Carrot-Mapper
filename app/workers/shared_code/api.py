import asyncio
import json
import os
from enum import Enum
from typing import Dict, List

import httpx
import requests
from shared_code import helpers
from shared_code.logger import logger

# Code for making request to the API
# At some we want to use the DB directly, and make this file unnecessary.

# Set up ccom API Args:
API_URL = os.environ.get("APP_URL", "") + "api/"
HEADERS = {
    "Content-type": "application/json",
    "charset": "utf-8",
    "Authorization": f"Token {os.environ.get('AZ_FUNCTION_KEY')}",
}


class ScanReportStatus(Enum):
    UPLOAD_IN_PROGRESS = "UPINPRO"
    UPLOAD_COMPLETE = "UPCOMPL"
    UPLOAD_FAILED = "UPFAILE"
    # Are these two below correct here?
    PENDING = "PENDING"
    COMPLETE = "COMPLET"


def update_scan_report_status(id: str, status: ScanReportStatus) -> None:
    """
    Updates the status of a scan report.

    Args:
        id (str): The ID of the scan report.
        status (ScanReportStatus): The message received from the queue.

    Raises:
        Exception: requests.HTTPError: If the request fails.
    """
    response = requests.patch(
        url=f"{API_URL}scanreports/{id}/",
        data=json.dumps({"upload_status": status.value}),
        headers=HEADERS,
    )
    response.raise_for_status()
    logger.info(f"Successfully set status to {status.value}")


def post_scan_report_table_entries(table_entries: List[Dict[str, str]]) -> List[str]:
    """
    Posts table entries to the API and returns the IDs generated.

    Args:
        table_entries (List[Dict[str, str]]): List of table entries to post.

    Returns:
        List[str]: A list of table IDs generated by the API.

    Raises:
        Exception: requests.HTTPError: If the request fails.
    """
    response = requests.post(
        url=f"{API_URL}scanreporttables/",
        data=json.dumps(table_entries),
        headers=HEADERS,
    )
    response.raise_for_status()
    tables_content = response.json()
    return [element["id"] for element in tables_content]


def post_scan_report_field_entries(
    field_entries_to_post: List[Dict[str, str]], scan_report_id: str
) -> List[str]:
    """
    POSTS field entries to the API and returns the responses.

    Args:
        field_entries_to_post (List[Dict[str, str]]): List of fields to create
        scan_report_id (str): Scan Report ID to attach to.

    Returns:
        List[str]: A list of responses returned by the API.

    Raises:
        Exception: requests.HTTPError: If the request fails.
    """
    paginated_field_entries_to_post = helpers.paginate(field_entries_to_post)
    fields_response_content = []

    for page in paginated_field_entries_to_post:
        response = requests.post(
            url=f"{API_URL}scanreportfields/",
            data=json.dumps(page),
            headers=HEADERS,
        )
        logger.info(
            f"FIELDS SAVE STATUS >>> {response.status_code} "
            f"{response.reason} {len(page)}"
        )

        if response.status_code != 201:
            update_scan_report_status(scan_report_id, ScanReportStatus.UPLOAD_FAILED)
        response.raise_for_status()
        fields_response_content += response.json()

    logger.info("POST fields all finished")
    return fields_response_content


async def post_chunks(
    chunked_data: List[List[Dict]],
    endpoint: str,
    text: str,
    table_name: str,
    scan_report_id: str,
) -> List[str]:
    """
    Post the chunked data to the specified endpoint.

    Args:
        chunked_data (List[List[Dict]]): A list of lists containing dictionaries of data to be posted.
        endpoint (str): The endpoint to which the data will be posted.
        text (str): A string representing the type of data being posted.
        table_name (str): The name of the table associated with the data.
        scan_report_id (str): The ID of the scan report.

    Returns:
        List[str]: A list of response content after posting the data.
    """
    response_content = []
    timeout = httpx.Timeout(60.0, connect=30.0)

    for chunk in chunked_data:
        async with httpx.AsyncClient(timeout=timeout) as client:
            tasks = []
            page_lengths = []
            for page in chunk:
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

        for response, page_length in zip(responses, page_lengths):
            logger.info(
                f"{text.upper()} SAVE STATUSES on {table_name} >>>"
                f" {response.status_code} "
                f"{response.reason_phrase} {page_length}"
            )

            if response.status_code != 201:
                update_scan_report_status(
                    scan_report_id, ScanReportStatus.UPLOAD_FAILED
                )
                response.raise_for_status()

            response_content += response.json()
    return response_content
