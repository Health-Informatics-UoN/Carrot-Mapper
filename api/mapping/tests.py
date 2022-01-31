from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory

from mapping.models import Project


class TestProjectListView(TestCase):
    def setUp(self):
        # Set up test users
        User = get_user_model()
        self.test_user1 = User(username="Prof. Xavier", password="heiiehjifehr123")
        self.test_user2 = User(username="Jean Gray", password="vjirjijeijire898")
        self.test_user1.save()
        self.test_user2.save()

        # Set up test project
        self.visible_project = Project(
            name="Unit test project"
        )
        self.visible_project.save()
        self.visible_project.members.add(self.test_user1)

    def test_retrieved_queryset(self):
        return False
