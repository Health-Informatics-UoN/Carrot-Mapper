import os
from typing import Any, Dict

from shared_code.logger import logger

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shared_code.django_settings")
import django

django.setup()

from shared.services.rules import refresh_mapping_rules
from shared_code.db import create_job, update_job, JobStageType, StageStatusType


def main(msg: Dict[str, Any]):
    """
    Refreshes mapping rules for a ScanReportTable.

    Args:
        - msg (Dict[str, Any]): The message received from the orchestrator.

    Return:
        - None
    """
    table_id = msg.pop("table_id")
    page = msg.pop("page_num")
    page_size = msg.pop("page_size")
    # create_job(
    #     JobStageType.GENERATE_RULES,
    #     StageStatusType.IN_PROGRESS,
    #     scan_report_table_id=table_id,
    # )
    # logger.info(f"Generating mapping rules for table: {table_id}, page: {page}")
    refresh_mapping_rules(table_id, page, page_size)
    logger.info(f"Finished mapping rules for table: {table_id}")
    # update_job(
    #     JobStageType.GENERATE_RULES,
    #     StageStatusType.COMPLETE,
    #     scan_report_table_id=table_id,
    # )

    return
