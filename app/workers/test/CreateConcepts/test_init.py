from CreateConcepts import _create_concepts


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
        {"concept_id": 1, "id": "A"},
        {"concept_id": 2, "id": "B"},
        {"concept_id": 3, "id": "B"},
        {"concept_id": 4, "id": "D"},
    ]
    assert result == expected_result


def test_add():
    pass
