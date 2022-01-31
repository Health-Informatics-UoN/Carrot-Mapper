from email.policy import default
from django.core.management.base import BaseCommand
from mapping.models import Dataset, ScanReport, Project


class Command(BaseCommand):
    def add_arguments(self, parser):
        """Add `project_name`, `dataset_name` and `scanreports` args."""
        parser.add_argument(
            "--project_name",
            required=False,
            type=str,
            default="No Project",
            help="""The dataset containing the scan report(s) will be added to this project.
            Default: "No Project"
            """,
        )
        parser.add_argument(
            "--dataset_name",
            required=False,
            type=str,
            default="Orphaned",
            help='''The scan reports will be added to this dataset.
            Default: the stored dataset name or "Orphaned"''',
        )
        parser.add_argument(
            "scanreports",
            default=[],
            nargs="*",
            help="(Optional) The names of the scan reports to add to the dataset and project.",
        )

    def handle(self, *args, **options):
        """Logic for finding orphaned Scan Reports
        and adding them to a Project and a Dataset.
        """
        project_name = options.get("project_name")
        dataset_name = options.get("dataset_name")
        scan_reports = options.get("scanreports")

        # `get_or_create` returns a tuple of (`QuerySet`, `bool`); extract the first element.
        project = Project.objects.get_or_create(name=project_name)[0]
        default_dataset = Dataset.objects.get_or_create(
            name=dataset_name,
            project=project.id,  # This doesn't work, add using `.projects.add` on next line
        )[0]

        if scan_reports:
            # Find the scan reports in your list which aren't in a dataset
            orphaned_scanreports = ScanReport.objects.filter(
                parent_dataset=None, dataset__in=scan_reports
            )
        else:
            # Or find all scan reports with which aren't in a dataset.
            orphaned_scanreports = ScanReport.objects.filter(parent_dataset=None)

        for orphan in orphaned_scanreports:
            # Try to use the dataset name that already exists to create a dataset
            if orphan.dataset:
                new_dataset = Dataset.objects.get_or_create(name=orphan.dataset)[0]
                orphan.parent_dataset = new_dataset
            # Otherwise use the specified or default dataset
            else:
                orphan.parent_dataset = default_dataset

            orphan.save()
