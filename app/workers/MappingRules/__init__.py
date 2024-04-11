import json
import os

import azure.functions as func

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shared_code.django_settings")
import django

django.setup()

from shared.services import refresh_mapping_rules


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

    refresh_mapping_rules(table_id)

    return
