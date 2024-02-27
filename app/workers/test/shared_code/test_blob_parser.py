from shared_code.blob_parser import process_three_item_dict, remove_BOM


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


def test_process_three_item_dict():
    # Arrange
    three_item_data = [
        {
            "csv_file_name": "table1",
            "field_name": "field1",
            "value": "value1",
            "code": "code1",
        },
        {
            "csv_file_name": "table1",
            "field_name": "field2",
            "value": "value2",
            "code": "code2",
        },
        {
            "csv_file_name": "table2",
            "field_name": "field2",
            "value": "value2",
            "code": "code2",
        },
        {
            "csv_file_name": "table3",
            "field_name": "field3",
            "value": "value3",
            "code": "code3",
        },
    ]

    # Act
    result = process_three_item_dict(three_item_data)

    # Assert
    expected_result = {
        "table1": {"field1": "code1", "field2": "code2"},
        "table2": {"field2": "code2"},
        "table3": {"field3": "code3"},
    }
    assert result == expected_result
