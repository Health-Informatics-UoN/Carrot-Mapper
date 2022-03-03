from django.core.management.base import BaseCommand
from mapping.models import DataPartner, Dataset


class Command(BaseCommand):
    def add_arguments(self, parser):
        pass

    def handle(self, *args, **options):
        """Logic for finding the first scan report of a dataset
        and setting the author as an admin.
        """

        pass
