from urllib import response
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
            name="Places in Middle Earth",
            visibility="PUBLIC"
        )
        self.public_dataset2 = Dataset.objects.create(
            name="Places in Valinor",
            visibility="PUBLIC"
        )
        self.public_dataset3 = Dataset.objects.create(
            name="The Rings of Power",
            visibility="PUBLIC"
        )
        self.restricted_dataset = Dataset.objects.create(
            name="Fellowship Members",
            visibility="RESTRICTED"
        )
        self.restricted_dataset.viewers.add(self.user1)

        # Set up projects
        self.project1 = Project.objects.create(name="The Fellowship of the Ring")
        self.project1.members.add(self.user1, self.user2)
        self.project1.datasets.add(
            self.public_dataset1,
            self.public_dataset2,
            self.restricted_dataset  # user2 can't see
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
        # Make the request for the Dataset
        request = self.factory.get(f"api/datasets/")
        # Add user1 to the request; this is not automatic
        request.user = self.user1
        # Authenticate the restricted user
        force_authenticate(
            request,
            user=self.user1,
            token=self.user1.auth_token,
        )
        # Get the response
        response_data = self.view(request).data

        # Assert user1 can only public_dataset1, public_dataset2
        # and restricted_dataset
        for obj in response_data:
            self.assertIn(
                obj.get("id"),
                [
                    self.public_dataset1.id,
                    self.public_dataset2.id,
                    self.restricted_dataset.id
                ],
            )

        # Assert user1 can't see public_dataset3
        for obj in response_data:
            self.assertNotEqual(obj.get("id"), self.public_dataset3.id)

        # Add user2 to the request; this is not automatic
        request.user = self.user2
        # Authenticate the restricted user
        force_authenticate(
            request,
            user=self.user2,
            token=self.user2.auth_token,
        )
        # Get the response
        response_data = self.view(request).data

        # Assert user2 can only public_dataset1 and public_dataset2
        for obj in response_data:
            self.assertIn(
                obj.get("id"),
                [self.public_dataset1.id, self.public_dataset2.id],
            )

        # Assert user2 can't see public_dataset3
        for obj in response_data:
            self.assertNotEqual(obj.get("id"), self.public_dataset3.id)