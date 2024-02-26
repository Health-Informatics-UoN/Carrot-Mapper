from unittest.mock import MagicMock, patch

import pytest
from azure.functions import QueueMessage
from shared_code import helpers

# Mocking the logger
logger = MagicMock()


def test__unwrap_message_body():
    # Arrange
    message_body = '{"test key": "test value"}'
    msg = QueueMessage(body=message_body.encode("utf-8"))

    # Act
    unwrapped_body = helpers._unwrap_message_body(msg)

    # Assert
    assert unwrapped_body == {"test key": "test value"}


def test__extract_details():
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


@pytest.mark.skip
@pytest.mark.parametrize("dequeue_count, should_raise_error", [(1, False), (2, True)])
def test__handle_failure(dequeue_count, should_raise_error):
    # Arrange
    msg = QueueMessage()
    with patch.object(msg, "dequeue_count", new=dequeue_count):
        scan_report_id = "sample_scan_report_id"

        # Act
        if should_raise_error:
            with pytest.raises(ValueError):
                helpers._handle_failure(msg, scan_report_id)
        else:
            helpers._handle_failure(msg, scan_report_id)

        # Assert
        # Ensure ValueError is raised only when it should be
        assert (
            logger.info.call_args_list[-1][0][0]
            == f"dequeue_count {str(dequeue_count)}"
        ) == (not should_raise_error)


def test__flatten_list():
    # Arrange
    nested_list = [[1, 2, 3], [4, 5], [6, 7, 8]]

    # Act
    flattened_list = helpers.flatten_list(nested_list)

    # Assert
    assert flattened_list == [1, 2, 3, 4, 5, 6, 7, 8]


@pytest.mark.parametrize("value, expected", [(1, 1), ("", 0.0), (None, 0.0)])
def test_default_zero(value, expected):
    # Act
    result = helpers.default_zero(value)

    # Assert
    assert result == expected
