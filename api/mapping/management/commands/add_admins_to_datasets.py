from django.core.management.base import BaseCommand
from mapping.models import DataPartner, Dataset


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "datasets",
            default=[],
            nargs="*",
            help="""(Optional) The names of the dataset(s) to add an admin.
            By default find all datasets with no admins and add the authors of the
            scan reports in the dataset.
            """,
        )

    def handle(self, *args, **options):
        """Logic for finding the first scan report of a dataset
        and setting the author as an admin.
        """

        pass
