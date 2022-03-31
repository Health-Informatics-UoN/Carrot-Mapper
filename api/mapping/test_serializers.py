import os
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, APIClient, force_authenticate
from rest_framework.authtoken.models import Token
from .models import Project, Dataset, ScanReport, VisibilityChoices
from .serializers import ScanReportEditSerializer


class TestScanReportEditSerializer(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create()
        self.project = Project.objects.create(name="The Fellowship of The Ring")
        self.dataset = Dataset.objects.create(
            name="Places in Middle Earth", visibility=VisibilityChoices.PUBLIC
        )
        self.project.datasets.add(self.dataset)
        self.scanreport = ScanReport.objects.create(
            dataset="The Shire",
            visibility=VisibilityChoices.PUBLIC,
            parent_dataset=self.dataset,
        )
        self.client = APIClient()

    def test_validate_editors(self):
        pass

    def test_validate_viewers(self):
        pass

    def test_validate_author(self):
        pass
