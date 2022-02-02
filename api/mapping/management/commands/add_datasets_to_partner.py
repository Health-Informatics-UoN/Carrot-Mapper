from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def add_arguments(self, parser):
        """Add `data_partner`, and `datasets` args."""
        parser.add_argument(
            "--data_partner",
            required=False,
            type=str,
            default="None",
            help='The data partner that owns the dataset(s). Default: "None"',
        )
        parser.add_argument(
            "datasets",
            default=[],
            nargs="*",
            help="""(Optional) The names of the dataset(s) to add to the data partner.
            By default find all datasets with no data partner and add them to the specified
            data partner.
            """,
        )

    def handle(self, *args, **options):
        pass
