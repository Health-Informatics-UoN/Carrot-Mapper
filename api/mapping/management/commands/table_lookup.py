from django.core.management.base import BaseCommand, CommandError
from mapping.models import OmopTable, OmopField
from mapping.models import ScanReport, ScanReportTable, ScanReportConcept
from mapping.models import ScanReportValue, ScanReportField

import json

class Command(BaseCommand):
    help = 'create rules from exisiting concepts'

    def add_arguments(self, parser):
        parser.add_argument('pk', type=int)

    def handle(self, *args, **options):
        pk = options['pk']
        #fields = ScanReportField.objects.filter(
        #    scan_report_table__scan_report=pk).filter(concept_id__gte=0)
        #        
        ##for field in fields:
        #    print (field.scan_report_table.name, field.name, field.concept_id)

        #report = ScanReport.objects.get(pk=pk)
        temp = {}
        concepts = ScanReportConcept.objects.all()
        for concept in concepts:
            
            content = concept.content_object
            report = None
            isValue=False

            if isinstance(content,ScanReportValue):
                isValue=True
                report = content.scan_report_field.scan_report_table.scan_report
            elif isinstance(content,ScanReportField):
                report = content.scan_report_table.scan_report
            else:
                continue

            _id = str(report)
            if _id != '90': continue

            print (concept.created_at)
            
            name = report.dataset

            if _id not in temp:
                temp[_id] = {'values':0,'fields':0,'name':name}

            key = 'fields'
            if isValue:
                key='values'
            temp[_id][key]+=1

        print (json.dumps(temp,indent=6)) 
