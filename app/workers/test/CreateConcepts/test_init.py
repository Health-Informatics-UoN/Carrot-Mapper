from CreateConcepts import _create_concepts, _set_defaults_for_none_vocab


def test__create_concepts():
    # Arrange
    table_values = [
        {"concept_id": 1, "id": "A"},
        {"concept_id": [2, 3], "id": "B"},
        {"concept_id": -1, "id": "C"},
        {"concept_id": 4, "id": "D"},
    ]

    # Act
    result = _create_concepts(table_values)

    # Assert
    expected_result = [
        {"concept": 1, "object_id": "A", "content_type": 17, "creation_type": "V"},
        {"concept": 2, "object_id": "B", "content_type": 17, "creation_type": "V"},
        {"concept": 3, "object_id": "B", "content_type": 17, "creation_type": "V"},
        {"concept": 4, "object_id": "D", "content_type": 17, "creation_type": "V"},
    ]
    assert result == expected_result


def test__set_defaults_for_none_vocab():
    # Arrange
    entries = [{"concept_id": 1, "standard_concept": "test"}]

    # Act
    _set_defaults_for_none_vocab(entries)

    # Assert
    entries == [{"concept_id": -1, "standard_concept": None}]
