import json
import os

import azure.functions as func
from shared_code import logger

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shared_code.django_settings")
import django

django.setup()

from shared.services.rules import refresh_mapping_rules


def main(msg: func.QueueMessage):
    """
    Refreshes mapping rules for a ScanReportTable.

    Args:
        - msg (func.QueueMessage): The message received from the queue.

    Return:
        - None
    """
    message_body = json.loads(msg.get_body().decode("utf-8"))
    table_id = message_body.get("table_id")
    logger.info("We're now mapping some rules")

    refresh_mapping_rules(table_id)
    logger.info("We are now refreshed.")

    return
