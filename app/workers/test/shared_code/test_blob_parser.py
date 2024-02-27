from shared_code.blob_parser import remove_BOM


def test_remove_BOM():
    # Arrange
    intermediate = [
        {"\ufeffkey1": "value1", "key2": "value2"},
        {"key1": "value1", "\ufeffkey2": "value2"},
        {"key1": "value1", "key2": "value2"},
    ]

    # Act
    result = remove_BOM(intermediate)

    # Assert
    expected_result = [
        {"key1": "value1", "key2": "value2"},
        {"key1": "value1", "key2": "value2"},
        {"key1": "value1", "key2": "value2"},
    ]
    assert result == expected_result
