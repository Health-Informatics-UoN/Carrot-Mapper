import json
import os
from typing import Any, Dict

import azure.functions as func
from shared_code.logger import logger

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shared_code.django_settings")
import django

django.setup()

from shared.services.rules import refresh_mapping_rules


def main(msg: Dict[str, Any]):
    """
    Refreshes mapping rules for a ScanReportTable.

    Args:
        - msg (func.QueueMessage): The message received from the queue.

    Return:
        - None
    """
    table_id = msg.get("table_id")
    page = msg.get("page_num")
    page_size = msg.get("page_size")

    logger.info(f"Generating mapping rules for table: {table_id}, page: {page}")

    refresh_mapping_rules(table_id, page, page_size)
    logger.info(f"Finished mapping rules for table: {table_id}")

    return
