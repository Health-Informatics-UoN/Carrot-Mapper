from django.core.management.base import BaseCommand, CommandError
from mapping.models import StructuralMappingRule,ScanReportConcept, ScanReportValue, ScanReportField
from mapping.services_rules import (
    get_mapping_rules_json,
    make_dag
)
from django.http import HttpRequest
import json

class Command(BaseCommand):
    help = 'generate_rules json'
    def add_arguments(self, parser):
        parser.add_argument('--report-id', required=True, type=int)
                            
    def handle(self, *args, **options):
        _id = options['report_id']
        qs = StructuralMappingRule.objects.filter(scan_report__id=_id)
        js = get_mapping_rules_json(qs)
        svg = make_dag(js['cdm'])
        print (json.dumps(js,indent=6))
        print (svg)
        
