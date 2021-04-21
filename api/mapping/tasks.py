
from celery import shared_task
from .models import ScanReport, NLPModel
from .services import process_scan_report, run_usagi
from .services_nlp import nlp_single_string


@shared_task
def add(x, y):
    return x + y


@shared_task
def mul(x, y):
    return x * y


@shared_task
def xsum(numbers):
    return sum(numbers)


@shared_task
def count_scanreports():
    return ScanReport.objects.count()


@shared_task
def rename_scanreport(scanreport_id, name):
    w = ScanReport.objects.get(id=scanreport_id)
    w.name = name
    w.save()


@shared_task
def process_scan_report_task(scan_report_id):
    process_scan_report(scan_report_id)


# @shared_task
# def import_data_dictionary_task(filepath):
#     import_data_dictionary(filepath)

@shared_task
def run_usagi_task(scan_report_id):
    run_usagi(scan_report_id) 
    
@shared_task
def nlp_single_string_task(pk, dict_string):
    nlp_single_string(pk=pk, dict_string=dict_string)

