from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from openpyxl import Workbook
from openpyxl.cell.cell import Cell
from UploadQueue import (
    _create_field_entry,
    _create_table_entry,
    _get_unique_table_names,
)


def test_get_unique_table_names():
    # Arrange
    worksheet_mock = MagicMock()

    sample_worksheet_data = [
        ["Table1"],
        ["Table2"],
        ["Table1"],
        ["Table3"],
        ["Table2"],
        ["Table4"],
    ]

    # Mock iter_rows
    worksheet_mock.iter_rows = MagicMock(
        return_value=(
            [MagicMock(value=cell_value) for cell_value in row_data]
            for row_data in sample_worksheet_data
        )
    )

    # Act
    result = _get_unique_table_names(worksheet_mock)

    # Assert
    expected_result = ["Table1", "Table2", "Table3", "Table4"]
    assert result == expected_result


def test_create_table_entry():
    # Arrange
    table_name = "SampleTableName"
    scan_report_id = "1"
    expected_datetime = "2024-02-29T00:00:00.000000Z"

    # Mock datetime to fixed
    with patch("UploadQueue.datetime") as mock_datetime:
        mock_datetime.now.return_value = datetime(2024, 2, 29, tzinfo=timezone.utc)

        # Act
        result = _create_table_entry(table_name, scan_report_id)

    # Assert
    expected_result = {
        "created_at": expected_datetime,
        "updated_at": expected_datetime,
        "name": "SampleTableName",
        "scan_report": "1",
        "person_id": None,
        "birth_date": None,
        "measurement_date": None,
        "condition_date": None,
        "observation_date": None,
    }
    assert result == expected_result


def test_create_field_entry():
    # Arrange
    row = (
        Cell(None, value="empty_row"),
        Cell(None, value="sample_name"),
        Cell(None, value="sample_description"),
        Cell(None, value="sample_type"),
        Cell(None, value="sample_max_length"),
        Cell(None, value="sample_nrows"),
        Cell(None, value="sample_nrows_checked"),
        Cell(None, value=None),
        Cell(None, value="sample_nunique_values"),
        Cell(None, value=None),
    )
    scan_report_table_id = "1"
    expected_datetime = "2024-02-29T00:00:00.000000Z"

    # Mock datetime.now to fix
    with patch("UploadQueue.datetime") as mock_datetime:
        mock_datetime.now.return_value = datetime(2024, 2, 29, tzinfo=timezone.utc)

        # Act
        result = _create_field_entry(row, scan_report_table_id)

    # Assert
    expected_result = {
        "scan_report_table": "1",
        "created_at": expected_datetime,
        "updated_at": expected_datetime,
        "name": "sample_name",
        "description_column": "sample_description",
        "type_column": "sample_type",
        "max_length": "sample_max_length",
        "nrows": "sample_nrows",
        "nrows_checked": "sample_nrows_checked",
        "fraction_empty": 0.0,
        "nunique_values": "sample_nunique_values",
        "fraction_unique": 0.0,
        "ignore_column": None,
    }
    assert result == expected_result
