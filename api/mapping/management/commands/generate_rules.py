from django.core.management.base import BaseCommand, CommandError
from mapping.models import ScanReportConcept, ScanReportValue, ScanReportField
from mapping.services_rules import (
    save_mapping_rules,
    remove_mapping_rules,
    find_existing_scan_report_concepts
)
from django.http import HttpRequest
#from django.contrib import messages


class Command(BaseCommand):
    help = 'create rules from exisiting concepts found for a given table id'
    def add_arguments(self, parser):
        parser.add_argument('--table-id', required=True, type=int)
        parser.add_argument('--clean', action='store_true')
                            
    def handle(self, *args, **options):
        request = None
        do_clean = options['clean']
        _id = options['table_id']

        if do_clean:
            remove_mapping_rules(request,_id)
        concepts = find_existing_scan_report_concepts(request,_id)

        n=len(concepts)
        for i,concept in enumerate(concepts):
            save_mapping_rules(request,concept)
            print (f"{i}/{n} done")
