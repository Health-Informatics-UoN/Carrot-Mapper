from django.core.management.base import BaseCommand, CommandError
from data.models.concept import Concept
from mapping.models import ScanReportConcept, ScanReportField, ScanReportValue
from mapping.services_rules import (
    save_mapping_rules,
    remove_mapping_rules,
    find_existing_scan_report_concepts
)



class Command(BaseCommand):
    help = 'create rules from existing concepts found for a given table id'

    def add_arguments(self, parser):
        parser.add_argument('--concept-id', required=True, type=int)
        parser.add_argument('--use-archived',default=False, type=bool)

    def handle(self, *args, **options):
        use_archived = options['use_archived']
        concept_id = options['concept_id']
        #get list of scan report concepts to loop through
        scan_report_concepts = ScanReportConcept.objects.filter(concept=concept_id) 
        # create list variable to populate with tuples
        finalList = []
        # loop through scan report concepts
        for scan_report_concept in scan_report_concepts:
            if (scan_report_concept.content_type_id==17):
                # If the scan report concept is for a value
                if (use_archived):#if archived scanreports are included, get all values with the object id from the scan report concept    
                    scan_report_values = ScanReportValue.objects.filter(pk=scan_report_concept.object_id)
                else:
                    #if archived scanreports are excluded, add a filter to remove archived reports from results
                    scan_report_values = ScanReportValue.objects.filter(
                        pk=scan_report_concept.object_id,
                        scan_report_field__scan_report_table__scan_report__hidden=False)
                #if there are any values returned by the query, get the field for the value and add tuple to final list
                if scan_report_values.exists():
                        scan_value = scan_report_values[0]
                        scan_report_fields = ScanReportField.objects.filter(pk=scan_value.scan_report_field_id)
                        scan_field = scan_report_fields[0]
                        finalList.append((scan_field.name ,scan_value.value,scan_value.value_description))
            elif (scan_report_concept.content_type_id==15):
                # If the scan report concept is for a field
                if (use_archived):#if archived scanreports are included, get all fields with the object id from the scan report concept 
                    scan_report_fields = ScanReportField.objects.filter(pk=scan_report_concept.object_id)
                else:
                    #if archived scanreports are excluded, add a filter to remove archived reports from results
                    scan_report_fields = ScanReportField.objects.filter(
                        pk=scan_report_concept.object_id,
                        scan_report_table__scan_report__hidden=False)
                #if there are any fields returned by the query, add tuple to final list
                if scan_report_fields.exists():
                    scan_field = scan_report_fields[0]
                    finalList.append((scan_field.name ,None,None))
        print(finalList)
        
    
            