import os
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from rest_framework.authtoken.models import Token
from rest_framework.serializers import ValidationError
from .models import Project, Dataset, ScanReport, VisibilityChoices
from .serializers import ScanReportEditSerializer


class TestScanReportEditSerializer(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create(
            username="gandalf", password="onfwojeijfe"
        )
        self.author_user = User.objects.create(
            username="frodo", password="owdjqwojdowjjwf"
        )
        self.non_admin_user = User.objects.create(
            username="saruman", password="pjwjfefjefew"
        )
        self.project = Project.objects.create(name="The Fellowship of The Ring")
        self.dataset = Dataset.objects.create(
            name="Places in Middle Earth", visibility=VisibilityChoices.PUBLIC
        )
        self.dataset.admins.add(self.admin_user)
        self.project.datasets.add(self.dataset)
        self.scanreport = ScanReport.objects.create(
            dataset="The Shire",
            visibility=VisibilityChoices.PUBLIC,
            parent_dataset=self.dataset,
            author=self.author_user,
        )

    def test_validate_editors(self):
        User = get_user_model()
        new_editor = User.objects.create(username="samwise", password="ejojwejfefe")
        request = APIRequestFactory().patch(
            "/the/path/to/isengard", data={"editors": [new_editor]}
        )
        # check non admin can't alter editors
        request.user = self.non_admin_user
        serializer = ScanReportEditSerializer(
            self.scanreport,
            data={"editors": [new_editor]},
            context={"request": request},
        )
        self.assertRaises(
            ValidationError, serializer.validate_editors, editors=[new_editor]
        )

        # check author can alter editors
        request.user = self.author_user
        serializer = ScanReportEditSerializer(
            self.scanreport,
            data={"editors": [new_editor]},
            context={"request": request},
        )
        self.assertListEqual(serializer.validate_editors([new_editor]), [new_editor])

        # check admin can alter editors
        request.user = self.admin_user
        serializer = ScanReportEditSerializer(
            self.scanreport,
            data={"editors": [new_editor]},
            context={"request": request},
        )
        self.assertListEqual(serializer.validate_editors([new_editor]), [new_editor])

    def test_validate_viewers(self):
        pass

    def test_validate_author(self):
        pass
