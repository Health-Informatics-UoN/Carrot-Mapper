from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.authtoken.models import Token
from .permissions import CanViewProject
from .views import ProjectRetrieveView
from .models import Project


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
