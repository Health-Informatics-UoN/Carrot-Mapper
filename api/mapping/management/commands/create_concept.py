from django.core.management.base import BaseCommand, CommandError
from data.models import concept
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

        querie_id = ScanReportConcept.objects.filter(concept_id=8507)
        # queries for
        for scan_report_concept in querie_id:
            content_object = scan_report_concept.content_object

            print(scan_report_concept.object_id,
                  scan_report_concept.content_type_id)

            if isinstance(content_object, ScanReportValue):
                scan_report_value = content_object
                scan_report_field = scan_report_value.scan_report_field
                print(scan_report_value.value, scan_report_value.value_description,
                      scan_report_value.scan_report_field_id, scan_report_field.name)


class Command(BaseCommand):
    help = 'create rules from existing concepts found for a given table id'

    def handle(self, *args, **options):

        male = 8507

        # queries ScanReportConcept table for rows where concept_id=8507
        querie_id = ScanReportConcept.objects.filter(concept_id=8507)

        for scan_report_concept in querie_id:
            content_object = scan_report_concept.content_object

            # print object_ids and content_type_ids
            print(scan_report_concept.object_id,
                  scan_report_concept.content_type_id)
            # If code ends here, it prints out only the object_ids and content_type_ids associated with the concept_id 8507

            if isinstance(content_object, ScanReportValue):
                scan_report_value = content_object
                scan_report_field = scan_report_value.scan_report_field

                # grab the value, value_description and scan_report_field_id from ScanReportValue. And field_name from ScanReportField.
                print(scan_report_value.value, scan_report_value.value_description,
                      scan_report_value.scan_report_field_id, scan_report_field.name)
