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
