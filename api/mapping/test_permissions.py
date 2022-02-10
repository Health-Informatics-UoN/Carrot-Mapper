from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.authtoken.models import Token
from .permissions import CanViewProject, CanViewDataset
from .views import ProjectRetrieveView, DatasetRetrieveView
from .models import Project, Dataset


class TestCanViewProject(TestCase):
    def setUp(self):
        User = get_user_model()
        # Create user who can access the Project
        self.user_with_perm = User.objects.create(
            username="gandalf", password="thegrey"
        )
        # Give them a token
        Token.objects.create(user=self.user_with_perm)

        # Create user who cannot access the Project
        self.user_without_perm = User.objects.create(
            username="balrog", password="youshallnotpass"
        )
        # Give them a token
        Token.objects.create(user=self.user_without_perm)

        # Create the project
        self.project = Project.objects.create(name="The Fellowship of the Ring")
        # Add the permitted user
        self.project.members.add(self.user_with_perm)

        # Request factory for setting up requests
        self.factory = APIRequestFactory()
        # The instance of the view required for the permission class
        self.view = ProjectRetrieveView.as_view()

        # The permission class
        self.permission = CanViewProject()

    def test_project_member_can_view(self):
        # Make the request for the Project
        request = self.factory.get(f"/projects/{self.project.id}")
        # Add the user to the request; this is not automatic
        request.user = self.user_with_perm
        # Authenticate the user
        force_authenticate(
            request, user=self.user_with_perm, token=self.user_with_perm.auth_token
        )
        # Assert the user on the project has permission to see the view
        self.assertTrue(
            self.permission.has_object_permission(request, self.view, self.project)
        )

    def test_non_project_member_cannot_view(self):
        # Make the request for the Project
        request = self.factory.get(f"/projects/{self.project.id}")
        # Add the user to the request; this is not automatic
        request.user = self.user_without_perm
        # Authenticate the user
        force_authenticate(
            request,
            user=self.user_without_perm,
            token=self.user_without_perm.auth_token,
        )
        # Assert the user not on the project doesn't have permission to see the view
        self.assertFalse(
            self.permission.has_object_permission(request, self.view, self.project)
        )


class TestCanViewDataset(TestCase):
    def setUp(self):
        User = get_user_model()
        # Create user who can see the Dataset whether restricted or public
        self.restricted_user = User.objects.create(
            username="gandalf", password="thegrey"
        )
        # Give them a token
        Token.objects.create(user=self.restricted_user)

        # Create user who can see the Dataset when public only
        self.public_user = User.objects.create(
            username="aragorn", password="elissar"
        )
        # Give them a token
        Token.objects.create(user=self.public_user)

        # Create user who cannot access the Project
        self.user_without_perm = User.objects.create(
            username="balrog", password="youshallnotpass"
        )
        # Give them a token
        Token.objects.create(user=self.user_without_perm)

        # Create the project
        self.project = Project.objects.create(name="The Fellowship of the Ring")
        # Add the permitted users
        self.project.members.add(self.public_user, self.restricted_user)
        # Create the public dataset
        self.public_dataset = Dataset.objects.create(name="Hobbits of the Fellowship", visibility="PUBLIC")
        # Create the restricted dataset
        self.restricted_dataset = Dataset.objects.create(name="Ring bearers", visibility="RESTRICTED")
        # Add the restricted users
        self.restricted_dataset.viewers.add(self.restricted_user)

        # Request factory for setting up requests
        self.factory = APIRequestFactory()
        # The instance of the view required for the permission class
        self.view = DatasetRetrieveView.as_view()

        # The permission class
        self.permission = CanViewDataset()

    def test_non_project_member_cannot_view(self):
        # Make the requests for the Dataset
        request1 = self.factory.get(f"api/datasets/{self.restricted_dataset.id}")
        request2 = self.factory.get(f"api/datasets/{self.public_dataset.id}")
        # Add the user to the requests; this is not automatic
        request1.user = self.user_without_perm
        request2.user = self.user_without_perm
        # Authenticate the user for first request
        force_authenticate(
            request1,
            user=self.user_without_perm,
            token=self.user_without_perm.auth_token,
        )
        # Assert the user not on the project doesn't have permission to see the view
        self.assertFalse(
            self.permission.has_object_permission(request1, self.view, self.restricted_dataset)
        )
        # Authenticate the user for second request
        force_authenticate(
            request2,
            user=self.user_without_perm,
            token=self.user_without_perm.auth_token,
        )
        # Assert the user not on the project doesn't have permission to see the view
        self.assertFalse(
            self.permission.has_object_permission(request2, self.view, self.public_dataset)
        )