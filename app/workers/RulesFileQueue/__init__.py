import io
import json
from datetime import datetime
from io import BytesIO
from typing import Any, Dict, Literal, TypedDict

import azure.functions as func
from django.db.models.query import QuerySet
from shared.data.models import MappingRule, ScanReport
from shared.files.models import FileDownload, FileType
from shared.files.service import upload_blob
from shared.services.rules_export import (
    get_mapping_rules_as_csv,
    get_mapping_rules_json,
    make_dag,
)


def create_json_rules(rules: QuerySet[MappingRule]):
    data = get_mapping_rules_json(rules)
    json_data = json.dumps(data)
    return BytesIO(json_data.encode("utf-8"))


def create_csv_rules(rules: QuerySet[MappingRule]):
    data = get_mapping_rules_as_csv(rules)
    return io.BytesIO(data.getvalue().encode("utf-8"))


class MessageBody(TypedDict):
    scan_report_id: int
    user_id: str
    file_type: Literal["text/csv", "application/json", "image/svg+xml"]


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

    # Get models for this Scan Report
    scan_report = ScanReport.objects.get(scan_report_id)
    rules = MappingRule.objects.filter(scan_report__id=scan_report_id).all()

    # Generate the file
    file_handlers: Dict[str, Dict[str, Any]] = {
        "text/csv": {
            "handler": lambda rules: create_csv_rules(rules),
            "file_type_value": "mapping_csv",
        },
        "application/json": {
            "handler": lambda rules: create_json_rules(rules),
            "file_type_value": "mapping_json",
        },
        "image/svg+xml": {
            "handler": lambda rules: make_dag(get_mapping_rules_json(rules)),
            "file_type_value": "mapping_svg",
        },
    }

    if file_type not in file_handlers:
        raise ValueError(f"Unsupported file type: {file_type}")

    # Generate the file
    handler = file_handlers[file_type]["handler"]
    file = handler(rules)

    # Save to blob
    filename = f"Rules - {scan_report.name} - {scan_report_id} - {datetime.now()}"
    upload_blob(filename, "rules-export", file, file_type)

    # create entity
    file_type_value = file_handlers[file_type]["file_type_value"]
    file_type_entity = FileType.objects.get(value=file_type_value)
    file_entity = FileDownload.objects.create(
        name=filename,
        scan_report_id=scan_report_id,
        user_id=user_id,
        file_type=file_type_entity,
        file_url="",
    )
    file_entity.save()
