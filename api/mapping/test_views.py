import os
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.authtoken.models import Token
from .views import DatasetListView
from .models import Project, Dataset


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
        request = self.factory.get(f"api/datasets/")
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
            f"api/datasets/", {"id__in": self.public_dataset1.id}
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
            f"api/datasets/", {"id__in": self.public_dataset3.id}
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
        request = self.factory.get(f"api/datasets/")
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
