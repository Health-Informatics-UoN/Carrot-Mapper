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

        # queries ScanReportConcept table for rows where concept_id=8507
        query_id = ScanReportConcept.objects.filter(concept_id=male)

        for scan_report_concept in query_id:
            content_object = scan_report_concept.content_object

            # print object_ids and content_type_ids
            print(scan_report_concept.object_id,
                  scan_report_concept.content_type_id)
            # If code ends here, it prints out only the object_ids and content_type_ids associated with the concept_id 8507

            scan_report_value = content_object
            scan_report_field = scan_report_value.scan_report_field

           # define lists
            scan_report_value_list = [scan_report_value.value, scan_report_value.value_description,
                                      scan_report_value.scan_report_field_id]

            scan_report_field_list = [scan_report_field.name]

            if isinstance(content_object, ScanReportValue):

                # if content_object is scanreportvalue, grab the value, value_description, and scan_report_field_id from ScanReportValue.
                scan_report_value_list.append(content_object)

            elif isinstance(content_object, ScanReportField):
                # But if content_object is scanreportfield, just grab the scanreportfield name.
                scan_report_field_list.append(content_object)

        print(scan_report_value_list, scan_report_field_list)
