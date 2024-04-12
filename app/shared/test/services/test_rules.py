import os
from unittest.mock import MagicMock, patch

import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
import django

django.setup()

from shared.data.models import ScanReportField, ScanReportTable
from shared.services import rules


def test__validate_person_id_and_date():
    # Arrange
    person_id = ScanReportField()
    date_event = ScanReportField()

    # Instance with person_id and date_event set
    table_with_both_fields = ScanReportTable(person_id=person_id, date_event=date_event)

    # Instance with only person_id set
    table_with_only_person_id = ScanReportTable(person_id=person_id, date_event=None)

    # Instance with only date_event set
    table_with_only_date_event = ScanReportTable(person_id=None, date_event=date_event)

    # Instance with neither set
    table_with_neither_field = ScanReportTable(person_id=None, date_event=None)

    # Act + Assert
    assert rules._validate_person_id_and_date(table_with_both_fields) is True
    assert rules._validate_person_id_and_date(table_with_only_person_id) is False
    assert rules._validate_person_id_and_date(table_with_only_date_event) is False
    assert rules._validate_person_id_and_date(table_with_neither_field) is False
