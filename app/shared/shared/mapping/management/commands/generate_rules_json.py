import json

from django.core.management.base import BaseCommand
from shared.mapping.models import MappingRule
from shared.services.rules_export import get_mapping_rules_json, make_dag


class Command(BaseCommand):
    help = "generate_rules json"

    def add_arguments(self, parser):
        parser.add_argument("--report-id", required=True, type=int)

    def handle(self, *args, **options):
        _id = options["report_id"]
        qs = MappingRule.objects.filter(scan_report__id=_id)
        js = get_mapping_rules_json(qs)
        svg = make_dag(js["cdm"])
        print(json.dumps(js, indent=6))
        print(svg)
