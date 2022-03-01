import os
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, APIClient, force_authenticate
from rest_framework.authtoken.models import Token
from .views import DatasetListView, ScanReportListViewSet
from .models import Project, Dataset, ScanReport, VisibilityChoices


class TestDatasetListView(TestCase):
    def setUp(self):
        User = get_user_model()
        # Set up users
        self.user1 = User.objects.create(username="gandalf", password="iwjfijweifje")
        Token.objects.create(user=self.user1)
        self.user2 = User.objects.create(username="aragorn", password="ooieriofiejr")
        Token.objects.create(user=self.user2)

        # Set up datasets
        self.public_dataset1 = Dataset.objects.create(
            name="Places in Middle Earth", visibility="PUBLIC"
        )
        self.public_dataset2 = Dataset.objects.create(
            name="Places in Valinor", visibility="PUBLIC"
        )
        self.public_dataset3 = Dataset.objects.create(
            name="The Rings of Power", visibility="PUBLIC"
        )
        self.restricted_dataset = Dataset.objects.create(
            name="Fellowship Members", visibility="RESTRICTED"
        )
        self.restricted_dataset.viewers.add(self.user1)

        # Set up projects
        self.project1 = Project.objects.create(name="The Fellowship of the Ring")
        self.project1.members.add(self.user1, self.user2)
        self.project1.datasets.add(
            self.public_dataset1,
            self.public_dataset2,
            self.restricted_dataset,  # user2 can't see
        )
        self.project2 = Project.objects.create(name="The Two Towers")
        self.project2.members.add(self.user1)
        self.project2.datasets.add(self.restricted_dataset)
        self.project3 = Project.objects.create(name="The Return of the King")
        self.project3.datasets.add(self.public_dataset3)

        # Request factory for setting up requests
        self.factory = APIRequestFactory()

        # The view for the tests
        self.view = DatasetListView.as_view()

    def test_dataset_returns(self):
        # Make the request for Datasets
        request = self.factory.get(f"/api/datasets/")
        # Add user1 to the request; this is not automatic
        request.user = self.user1
        # Authenticate the user1
        force_authenticate(
            request,
            user=self.user1,
            token=self.user1.auth_token,
        )
        # Get the response data
        response_data = self.view(request).data
        response_data = [obj.get("id") for obj in response_data]
        expected_objs = [
            self.public_dataset1.id,
            self.public_dataset2.id,
            self.restricted_dataset.id,
        ]

        # Assert user1 can only public_dataset1, public_dataset2
        # and restricted_dataset
        self.assertEqual(sorted(response_data), sorted(expected_objs))

        # Assert user1 can't see public_dataset3
        for obj in response_data:
            self.assertNotEqual(obj, self.public_dataset3.id)

        # Add user2 to the request; this is not automatic
        request.user = self.user2
        # Authenticate the user2
        force_authenticate(
            request,
            user=self.user2,
            token=self.user2.auth_token,
        )
        # Get the response
        response_data = self.view(request).data
        response_data = [obj.get("id") for obj in response_data]
        expected_objs = [self.public_dataset1.id, self.public_dataset2.id]

        # Assert user2 can only public_dataset1 and public_dataset2
        self.assertEqual(sorted(response_data), sorted(expected_objs))

        # Assert user2 can't see public_dataset3
        for obj in response_data:
            self.assertNotEqual(obj, self.public_dataset3.id)

    def test_dataset_filtering(self):
        # Make the request for the public_dataset1
        request = self.factory.get(
            f"/api/datasets/", {"id__in": self.public_dataset1.id}
        )
        # Add user1 to the request; this is not automatic
        request.user = self.user1
        # Authenticate user1
        force_authenticate(
            request,
            user=self.user1,
            token=self.user1.auth_token,
        )
        # Get the response
        response_data = self.view(request).data
        response_data = [obj.get("id") for obj in response_data]

        # Assert only got public_dataset1
        self.assertEqual(len(response_data), 1)
        self.assertEqual(response_data[0], self.public_dataset1.id)

        # Make the request for the public_dataset3
        request = self.factory.get(
            f"/api/datasets/", {"id__in": self.public_dataset3.id}
        )
        # Add user1 to the request; this is not automatic
        request.user = self.user1
        # Authenticate user1
        force_authenticate(
            request,
            user=self.user1,
            token=self.user1.auth_token,
        )
        # Get the response
        response_data = self.view(request).data

        # Assert response is empty
        self.assertEqual(response_data, [])

    def test_az_function_user_perm(self):
        User = get_user_model()
        az_user = User.objects.get(username=os.getenv("AZ_FUNCTION_USER"))
        # Make the request for the Dataset
        request = self.factory.get(f"/api/datasets/")
        # Add the user to the request; this is not automatic
        request.user = az_user
        # Authenticate az_user
        force_authenticate(
            request,
            user=az_user,
            token=az_user.auth_token,
        )
        # Get the response
        response_data = self.view(request).data
        # Assert az_user can see all datasets
        self.assertEqual(len(response_data), Dataset.objects.all().count())


class TestDatasetUpdateView(TestCase):
    def setUp(self):
        User = get_user_model()
        # Set up users
        self.admin_user = User.objects.create(
            username="gandalf", password="hjfiwejfiwef"
        )
        Token.objects.create(user=self.admin_user)
        self.non_admin_user = User.objects.create(
            username="aragorn", password="djfoiejwiofjoiewf"
        )
        Token.objects.create(user=self.non_admin_user)
        self.non_project_user = User.objects.create(
            username="bilbo", password="djfoiejwiofjoiewf"
        )
        Token.objects.create(user=self.non_project_user)

        # Set up Project
        self.project = Project.objects.create(name="The Fellowship of the Ring")
        self.project.members.add(self.admin_user, self.non_admin_user)

        # Set up Dataset
        self.dataset = Dataset.objects.create(
            name="The Heights of Hobbits", visibility=VisibilityChoices.PUBLIC
        )
        self.dataset.admins.add(self.admin_user)
        self.project.datasets.add(self.dataset)

        # Request factory for setting up requests
        self.client = APIClient()

    def test_update_returns(self):
        # Authenticate admin user
        self.client.force_authenticate(self.admin_user)
        #  Make the request
        response = self.client.patch(
            f"/api/datasets/update/{self.dataset.id}", data={"name": "The Two Towers"}
        )
        response_data = response.data
        # Ensure admin user can update Dataset
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data.get("name"), "The Two Towers")

    def test_non_admin_member_forbidden(self):
        # Authenticate non admin user
        self.client.force_authenticate(self.non_admin_user)
        #  Make the request
        response = self.client.patch(
            f"/api/datasets/update/{self.dataset.id}", data={"name": "The Two Towers"}
        )
        # Ensure non admin user is Forbidden
        self.assertEqual(response.status_code, 403)

    def test_non_project_member_forbidden(self):
        # Authenticate non project user
        self.client.force_authenticate(self.non_project_user)
        #  Make the request
        response = self.client.patch(
            f"/api/datasets/update/{self.dataset.id}", data={"name": "The Two Towers"}
        )
        # Ensure non project user is Forbidden
        self.assertEqual(response.status_code, 403)


class TestDatasetDeleteView(TestCase):
    def setUp(self):
        User = get_user_model()
        # Set up users
        self.admin_user = User.objects.create(
            username="gandalf", password="hjfiwejfiwef"
        )
        Token.objects.create(user=self.admin_user)
        self.non_admin_user = User.objects.create(
            username="aragorn", password="djfoiejwiofjoiewf"
        )
        Token.objects.create(user=self.non_admin_user)
        self.non_project_user = User.objects.create(
            username="bilbo", password="djfoiejwiofjoiewf"
        )
        Token.objects.create(user=self.non_project_user)

        # Set up Project
        self.project = Project.objects.create(name="The Fellowship of the Ring")
        self.project.members.add(self.admin_user, self.non_admin_user)

        # Set up Dataset
        self.dataset = Dataset.objects.create(
            name="The Heights of Hobbits", visibility=VisibilityChoices.PUBLIC
        )
        self.dataset.admins.add(self.admin_user)
        self.project.datasets.add(self.dataset)

        # Request factory for setting up requests
        self.client = APIClient()

    def test_update_returns(self):
        # Authenticate admin user
        self.client.force_authenticate(self.admin_user)
        #  Make the request
        response = self.client.delete(f"/api/datasets/delete/{self.dataset.id}")
        # Ensure admin user can delete Dataset
        self.assertEqual(response.status_code, 204)

    def test_non_admin_member_forbidden(self):
        # Authenticate non admin user
        self.client.force_authenticate(self.non_admin_user)
        #  Make the request
        response = self.client.delete(f"/api/datasets/delete/{self.dataset.id}")
        # Ensure non admin user is Forbidden
        self.assertEqual(response.status_code, 403)

    def test_non_project_member_forbidden(self):
        # Authenticate non project user
        self.client.force_authenticate(self.non_project_user)
        #  Make the request
        response = self.client.delete(f"/api/datasets/delete/{self.dataset.id}")
        # Ensure non project user is Forbidden
        self.assertEqual(response.status_code, 403)


class TestScanScanReportListViewset(TestCase):
    def setUp(self):
        User = get_user_model()
        # Set up users
        self.user1 = User.objects.create(username="gandalf", password="iwjfijweifje")
        Token.objects.create(user=self.user1)
        self.user2 = User.objects.create(username="aragorn", password="ooieriofiejr")
        Token.objects.create(user=self.user2)

        # Set up datasets
        self.public_dataset = Dataset.objects.create(
            name="Places in Middle Earth", visibility=VisibilityChoices.PUBLIC
        )
        self.restricted_dataset = Dataset.objects.create(
            name="Fellowship Members", visibility=VisibilityChoices.RESTRICTED
        )
        self.restricted_dataset.viewers.add(self.user1)

        # Set up scan reports
        self.public_scanreport = ScanReport.objects.create(
            dataset="The Mines of Moria",
            visibility=VisibilityChoices.PUBLIC,
            parent_dataset=self.public_dataset,
        )
        self.restricted_scanreport1 = ScanReport.objects.create(
            dataset="The Rings of Power",
            visibility=VisibilityChoices.RESTRICTED,
            parent_dataset=self.public_dataset,
        )
        self.restricted_scanreport1.viewers.add(self.user1, self.user2)
        self.restricted_scanreport2 = ScanReport.objects.create(
            dataset="The Balrogs of Morgoth",
            visibility=VisibilityChoices.RESTRICTED,
            parent_dataset=self.restricted_dataset,
        )
        self.restricted_scanreport2.viewers.add(self.user1)

        # Set up projects
        self.project1 = Project.objects.create(name="The Fellowship of the Ring")
        self.project1.members.add(self.user1, self.user2)
        self.project1.datasets.add(
            self.public_dataset,
            self.restricted_dataset,
        )
        self.project2 = Project.objects.create(name="The Two Towers")
        self.project2.members.add(self.user1)
        self.project2.datasets.add(self.restricted_dataset)

        # Request factory for setting up requests
        self.factory = APIRequestFactory()

        # The view for the tests
        self.view = ScanReportListViewSet.as_view({"get": "list"})

    def test_scanreport_returns(self):
        # Make the request for Datasets
        request = self.factory.get(f"/scanreports/")
        # Add user1 to the request; this is not automatic
        request.user = self.user1
        # Authenticate the user1
        force_authenticate(
            request,
            user=self.user1,
            token=self.user1.auth_token,
        )
        # Get the response data
        response_data = self.view(request).data
        response_data = [obj.get("id") for obj in response_data]
        expected_objs = [
            self.public_scanreport.id,
            self.restricted_scanreport1.id,
            self.restricted_scanreport2.id,
        ]

        # Assert user1 can see all scan reports
        # and restricted_dataset
        self.assertEqual(sorted(response_data), sorted(expected_objs))

        # Add user2 to the request; this is not automatic
        request.user = self.user2
        # Authenticate the user2
        force_authenticate(
            request,
            user=self.user2,
            token=self.user2.auth_token,
        )
        # Get the response
        response_data = self.view(request).data
        response_data = [obj.get("id") for obj in response_data]
        expected_objs = [self.public_scanreport.id, self.restricted_scanreport1.id]

        # Assert user2 can see public_scanreport and restricted_scanreport1
        self.assertEqual(sorted(response_data), sorted(expected_objs))

        # Assert user2 can't see restricted_scanreport2
        for obj in response_data:
            self.assertNotEqual(obj, self.restricted_scanreport2.id)

    def test_az_function_user_perm(self):
        User = get_user_model()
        az_user = User.objects.get(username=os.getenv("AZ_FUNCTION_USER"))
        # Make the request for the Dataset
        request = self.factory.get(f"/scanreports/")
        # Add the user to the request; this is not automatic
        request.user = az_user
        # Authenticate az_user
        force_authenticate(
            request,
            user=az_user,
            token=az_user.auth_token,
        )
        # Get the response
        response_data = self.view(request).data
        # Assert az_user can see all scan reports
        self.assertEqual(len(response_data), ScanReport.objects.all().count())
