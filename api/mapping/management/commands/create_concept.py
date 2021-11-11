from django.core.management.base import BaseCommand, CommandError
from data.models.concept import Concept
from mapping.models import ScanReportConcept, ScanReportField, ScanReportValue
from mapping.services_rules import (
    save_mapping_rules,
    remove_mapping_rules,
    find_existing_scan_report_concepts
)
from django.http import HttpRequest


class Command(BaseCommand):
    help = 'create rules from existing concepts found for a given table id'

    def handle(self, *args, **options):

        male = 8507
        Retlist = []
        # queries ScanReportConcept table for rows where concept_id=8507
        query_id = ScanReportConcept.objects.filter(concept=male)

        for scan_report_concept in query_id:
            content_object = scan_report_concept.content_object

            # print object_ids and content_type_ids and append to Retlist.
            Retlist.extend([scan_report_concept.object_id,
                           scan_report_concept.content_type_id])
            # If code ends here, it prints out only the object_ids and content_type_ids associated with the concept_id 8507

            scan_report_values = ScanReportValue.objects.filter(
                conceptID=male)
            # I have had to use this conceptID because ScanReportValues are not callable using the object_id and content_type_id retrieved above. Comes back with an error.
            for scan_report_value in scan_report_values:
             # if content_object is scanreportvalue, grab the value, value_description, and scan_report_field_id and append to Retlist.
                Retlist.extend([scan_report_value.value, scan_report_value.value_description,
                               scan_report_value.scan_report_field_id])

             # using the scan_report_field_id of 157 retrieved above, search the ScanReportField for field name and append fieldname to Retlist
            scan_report_fields = ScanReportField.objects.filter(
                id=157)
            for scan_report_field in scan_report_fields:
                Retlist.extend([scan_report_field.name])

            print(Retlist)
            # print(scan_report_field.name)
