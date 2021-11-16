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

        concept_id = 8507 # id for male
        scan_report_concepts = ScanReportConcept.objects.filter(concept=concept_id) 
        
        finalList = []
        #print(scan_report_concepts.values())
        for scan_report_concept in scan_report_concepts:
            if (scan_report_concept.content_type_id==17):
                # If it is for a value
                scan_report_values = ScanReportValue.objects.filter(pk=scan_report_concept.object_id)
                scan_value = scan_report_values[0]
                scan_report_fields = ScanReportField.objects.filter(pk=scan_value.scan_report_field_id)
                scan_field = scan_report_fields[0]
                finalList.append((scan_field.name ,scan_value.value,scan_value.value_description))
            if (scan_report_concept.content_type_id==15):
                # If it is for a field
                scan_report_fields = ScanReportField.objects.filter(pk=scan_report_concept.object_id)
                scan_field = scan_report_fields[0]
                finalList.append((scan_field.name ,None,None))
        print(finalList)
        
    
            