import os

import azure.functions

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shared_code.django_settings")
import django

django.setup()

from shared.data.models import ScanReport


def main(req: azure.functions.HttpRequest) -> str:
    reports = ScanReport.objects.all().count()
    return f"Hello, you have {reports} scan reports in the database!"
