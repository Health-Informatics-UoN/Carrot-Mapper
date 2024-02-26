from unittest.mock import MagicMock

import pytest
from azure.functions import QueueMessage
from shared_code import helpers

# Mocking the logger
logger = MagicMock()


def test_unwrap_message_body():
    # Arrange
    message_body = '{"test key": "test value"}'
    msg = QueueMessage(body=message_body.encode("utf-8"))

    # Act
    unwrapped_body = helpers._unwrap_message_body(msg)

    # Assert
    assert unwrapped_body == {"test key": "test value"}


def test_extract_details():
    # Arrange
    message = {
        "scan_report_blob": "scan_report_blob",
        "data_dictionary_blob": "data_dictionary_blob",
        "scan_report_id": "scan_report_id",
        "table_id": "table_id",
    }

    # Act
    result = helpers._extract_details(message)

    # Assert
    expected_result = (
        "scan_report_blob",
        "data_dictionary_blob",
        "scan_report_id",
        "table_id",
    )
    assert result == expected_result
