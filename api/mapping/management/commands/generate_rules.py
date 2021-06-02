from django.core.management.base import BaseCommand, CommandError
from mapping.models import ScanReportConcept, ScanReportValue, ScanReportField
from mapping.services_rules import save_mapping_rules
from django.http import HttpRequest
#from django.contrib import messages


class Command(BaseCommand):
    help = 'create rules from exisiting concepts'

    def handle(self, *args, **options):
        request = None#HttpRequest()
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

            if str(report) != '90':
                continue

            print ('saving rule for ',concept)
            save_mapping_rules(request,concept)
