from django.test import TestCase

from .services import process_scan_report_sheet_table


class ServiceTests(TestCase):

    def test_process_scan_report_sheet_table(self):

            # Tell it what file you want to process
            filename = '/api/mapping/data/value_frequency_test_data.csv'

            # Run the test on filename
            # This function is in services.py
            result = process_scan_report_sheet_table(filename)


        self.assertIs(4, len(result))
