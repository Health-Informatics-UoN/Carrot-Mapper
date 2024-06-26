import os
from unittest.mock import patch

import pytest
from azure.functions import QueueMessage
from shared_code import helpers


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


def test_handle_max_chars():
    # Arrange
    os.environ["PAGE_MAX_CHARS"] = "10"

    # Act
    result = helpers.handle_max_chars()

    # Assert
    result == 10


def test_paginate():
    # Arrange
    entries = ["One", "Two"]

    # Act
    result = helpers.paginate(entries, 1)

    # Assert
    expected = [[], ["One"], ["Two"]]
    assert result == expected


def test_get_by_concept_id():
    # Arrange
    concept_id = 1
    expected_item = {"concept_id": concept_id}
    entries = [expected_item, {"concept_id": 2}]

    # Act
    result = helpers.get_by_concept_id(entries, concept_id)

    # Assert
    assert result == expected_item


def test_add_vocabulary_id_to_entries():
    # Arrange
    values = [{"scan_report_field": {"id": 2, "name": "field name"}}]
    vocab = {"table 1": {"field name": "LOINC"}}
    table_name = "table 1"

    # Act
    helpers.add_vocabulary_id_to_entries(values, vocab, table_name)

    # Assert
    expected = [
        {"scan_report_field": {"id": 2, "name": "field name"}, "vocabulary_id": "LOINC"}
    ]
    assert values == expected
