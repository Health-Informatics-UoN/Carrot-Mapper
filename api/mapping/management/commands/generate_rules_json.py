from django.core.management.base import BaseCommand, CommandError
from mapping.models import StructuralMappingRule,ScanReportConcept, ScanReportValue, ScanReportField
from mapping.services_rules import (
    get_mapping_rules_json_batch
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
        print (json.dumps(get_mapping_rules_json_batch(qs),indent=6))
        
        
