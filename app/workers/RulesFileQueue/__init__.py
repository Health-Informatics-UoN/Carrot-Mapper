import json
from typing import Any, Literal, TypedDict

import azure.functions as func
from shared.data.models import MappingRule
from shared.files.models import FileDownload
from shared.files.service import upload_blob
from shared.services.rules_export import (
    get_mapping_rules_as_csv,
    get_mapping_rules_json,
    make_dag,
)


class MessageBody(TypedDict):
    scan_report_id: int
    user_id: str
    file_type: Literal["csv", "json", "svg"]


def main(msg: func.QueueMessage) -> None:
    """
    Processes a queue message
    Unwraps the message content
    Gets the data
    Creates the file
    Saves the file to storage
    Creates the download model.

    Args:
        msg (func.QueueMessage): The message received from the queue.
    """
    # Unwrap message
    msg_body: MessageBody = json.loads(msg.get_body().decode("utf-8"))
    scan_report_id = msg_body.get("scan_report_id")
    user_id = msg_body.get("user_id")
    file_type = msg_body.get("file_type")

    # Get rules for this Scan Report
    rules = MappingRule.objects.filter(scan_report__id=scan_report_id).all()

    # Generate the file
    file_type_handlers = {
        "csv": lambda rules: get_mapping_rules_as_csv(rules),
        "json": lambda rules: get_mapping_rules_json(rules),
        "svg": lambda rules: make_dag(get_mapping_rules_json(rules)),
    }

    if file_type in file_type_handlers:
        data: Any = file_type_handlers[file_type](rules)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

    # Save file to blob
    upload_blob("", "rules-export", data, file_type)

    # create entity
    entity = FileDownload.objects.create(
        name="", scan_report=scan_report_id, user=user_id, file_type="", file_url=""
    )
    entity.save()
