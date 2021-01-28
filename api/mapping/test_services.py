from django.test import TestCase

from .services import process_scan_report_sheet_table


class ServiceTests(TestCase):

    def test_process_scan_report_sheet_table(self):

        filename = '/api/mapping/data/test.csv'

        result = process_scan_report_sheet_table(filename)

        self.assertIs(4, len(result))
