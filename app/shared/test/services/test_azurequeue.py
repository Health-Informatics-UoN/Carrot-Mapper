import os
from unittest.mock import MagicMock, patch

import pytest
from shared.services.azurequeue import add_message


@pytest.fixture
def mock_queue_client():
    mock_instance = MagicMock()
    mock_instance.send_message.return_value = None
    mock_class = MagicMock(return_value=mock_instance)
    mock_class.from_connection_string.return_value = mock_instance
    with patch("shared.services.azurequeue.QueueClient", mock_class):
        yield mock_class


def test_add_message_with_connection_string(mock_queue_client):
    queue_name = "test_queue"
    message = {"key": "value"}
    conn_str = "mock_connection_string"

    add_message(queue_name, message, conn_str=conn_str)

    mock_queue_client.from_connection_string.assert_called_once_with(
        conn_str=conn_str, queue_name=queue_name
    )
    mock_queue_client.return_value.send_message.assert_called_once()


def test_add_message_with_environment_variable(mock_queue_client):
    queue_name = "test_queue"
    message = {"key": "value"}

    with patch.dict(os.environ, {"STORAGE_CONN_STRING": "mock_conn_str"}):
        add_message(queue_name, message)

    mock_queue_client.from_connection_string.assert_called_once_with(
        conn_str="mock_conn_str", queue_name=queue_name
    )
    mock_queue_client.return_value.send_message.assert_called_once()


def test_add_message_without_connection_string():
    queue_name = "test_queue"
    message = {"key": "value"}

    with pytest.raises(ValueError):
        add_message(queue_name, message)
