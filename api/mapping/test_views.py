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


class TestDatasetRetrieveView(TestCase):
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
            name="The Heights of Hobbits", visibility=VisibilityChoices.RESTRICTED
        )
        self.dataset.viewers.add(self.non_admin_user)
        self.dataset.admins.add(self.admin_user)
        self.project.datasets.add(self.dataset)

        # Request factory for setting up requests
        self.client = APIClient()

    def test_non_admin_member_can_see(self):
        # Authenticate non admin user
        self.client.force_authenticate(self.non_admin_user)
        #  Make the request
        response = self.client.get(f"/api/datasets/{self.dataset.id}")
        # Ensure non admin user can see
        self.assertEqual(response.status_code, 200)

    def test_admin_member_can_see(self):
        # Authenticate admin user
        self.client.force_authenticate(self.admin_user)
        #  Make the request
        response = self.client.get(f"/api/datasets/{self.dataset.id}")
        # Ensure admin user can see
        self.assertEqual(response.status_code, 200)

    def test_non_project_member_forbidden(self):
        # Authenticate non project user
        self.client.force_authenticate(self.non_project_user)
        #  Make the request
        response = self.client.get(f"/api/datasets/{self.dataset.id}")
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


class TestScanReportListViewset(TestCase):
    def setUp(self):
        # Set up datasets
        self.public_dataset = Dataset.objects.create(
            name="The Shire", visibility=VisibilityChoices.PUBLIC
        )
        self.restricted_dataset = Dataset.objects.create(
            name="The Mines of Moria", visibility=VisibilityChoices.RESTRICTED
        )

        # Set up scan reports
        self.scanreport1 = ScanReport.objects.create(
            dataset="The Heights of Hobbits",
            visibility=VisibilityChoices.PUBLIC,
            parent_dataset=self.public_dataset,
        )
        self.scanreport2 = ScanReport.objects.create(
            dataset="The Kinds of Orcs",
            visibility=VisibilityChoices.RESTRICTED,
            parent_dataset=self.public_dataset,
        )
        self.scanreport3 = ScanReport.objects.create(
            dataset="The Ents of Fangorn Forest",
            visibility=VisibilityChoices.RESTRICTED,
            parent_dataset=self.restricted_dataset,
        )

        # Set up projects
        self.project = Project.objects.create(name="The Fellowship of The Ring")
        self.project.datasets.add(self.public_dataset, self.restricted_dataset)

        # Set up API client
        self.client = APIClient()

    def test_admin_user_get(self):
        """Users who are admins of the parent dataset can see all public SRs
        and restricted SRs whose parent dataset they are the admin of.
        """
        User = get_user_model()

        # user who is an admin the parent dataset
        admin_user = User.objects.create(username="gandalf", password="fiwuenfwinefiw")
        self.project.members.add(admin_user)
        self.public_dataset.admins.add(admin_user)
        self.restricted_dataset.admins.add(admin_user)

        # Get data admin_user should be able to see
        self.client.force_authenticate(admin_user)
        admin_response = self.client.get("/api/scanreports/")
        self.assertEqual(admin_response.status_code, 200)
        observed_objs = sorted([obj.get("id") for obj in admin_response.data])
        expected_objs = sorted(
            [self.scanreport1.id, self.scanreport2.id, self.scanreport3.id]
        )

        # Assert the observed results are the same as the expected
        self.assertListEqual(observed_objs, expected_objs)

        # user who is not an admin the parent dataset
        non_admin_user = User.objects.create(
            username="saruman", password="fiwuenfwinefiw"
        )
        self.project.members.add(non_admin_user)

        # Get data admin_user should be able to see
        self.client.force_authenticate(non_admin_user)
        non_admin_response = self.client.get("/api/scanreports/")
        self.assertEqual(non_admin_response.status_code, 200)
        observed_objs = sorted([obj.get("id") for obj in non_admin_response.data])
        expected_objs = [self.scanreport1.id]

        # Assert the observed results are the same as the expected
        self.assertListEqual(observed_objs, expected_objs)

    def test_editor_perms(self):
        """Users who are editors of the parent dataset can see all public SRs
        and restricted SRs whose parent dataset they are an editor of.
        """
        User = get_user_model()

        # user who is an admin the parent dataset
        editor_user = User.objects.create(username="gandalf", password="fiwuenfwinefiw")
        self.project.members.add(editor_user)
        self.public_dataset.editors.add(editor_user)
        self.restricted_dataset.editors.add(editor_user)

        # Get data admin_user should be able to see
        self.client.force_authenticate(editor_user)
        admin_response = self.client.get("/api/scanreports/")
        self.assertEqual(admin_response.status_code, 200)
        observed_objs = sorted([obj.get("id") for obj in admin_response.data])
        expected_objs = sorted(
            [self.scanreport1.id, self.scanreport2.id, self.scanreport3.id]
        )

        # Assert the observed results are the same as the expected
        self.assertListEqual(observed_objs, expected_objs)

        # user who is not an admin the parent dataset
        non_editor_user = User.objects.create(
            username="saruman", password="fiwuenfwinefiw"
        )
        self.project.members.add(non_editor_user)

        # Get data admin_user should be able to see
        self.client.force_authenticate(non_editor_user)
        non_admin_response = self.client.get("/api/scanreports/")
        self.assertEqual(non_admin_response.status_code, 200)
        observed_objs = sorted([obj.get("id") for obj in non_admin_response.data])
        expected_objs = [self.scanreport1.id]

        # Assert the observed results are the same as the expected
        self.assertListEqual(observed_objs, expected_objs)

    def test_viewer_perms(self):
        pass

    def test_author_get(self):
        """Authors can see all public SRs and restricted SRs they are the author of."""
        User = get_user_model()

        # user who is the author of a scan report
        author_user = User.objects.create(username="gandalf", password="fiwuenfwinefiw")
        self.project.members.add(author_user)
        self.scanreport3.author = author_user
        self.scanreport3.save()

        # Get data admin_user should be able to see
        self.client.force_authenticate(author_user)
        admin_response = self.client.get("/api/scanreports/")
        self.assertEqual(admin_response.status_code, 200)
        observed_objs = sorted([obj.get("id") for obj in admin_response.data])
        expected_objs = sorted([self.scanreport1.id, self.scanreport3.id])

        # Assert the observed results are the same as the expected
        self.assertListEqual(observed_objs, expected_objs)

        # user who is not the author of a scan report
        non_author_user = User.objects.create(
            username="saruman", password="fiwuenfwinefiw"
        )
        self.project.members.add(non_author_user)

        # Get data admin_user should be able to see
        self.client.force_authenticate(non_author_user)
        admin_response = self.client.get("/api/scanreports/")
        self.assertEqual(admin_response.status_code, 200)
        observed_objs = sorted([obj.get("id") for obj in admin_response.data])
        expected_objs = sorted([self.scanreport1.id])

        # Assert the observed results are the same as the expected
        self.assertListEqual(observed_objs, expected_objs)

    def test_az_function_user_perms(self):
        """AZ_FUNCTION_USER can see all public SRs and restricted SRs."""
        User = get_user_model()

        # user who is the author of a scan report
        az_user = User.objects.get(username=os.getenv("AZ_FUNCTION_USER"))
        self.project.members.add(az_user)
        self.scanreport3.author = az_user
        self.scanreport3.save()

        # Get data admin_user should be able to see
        self.client.force_authenticate(az_user)
        admin_response = self.client.get("/api/scanreports/")
        self.assertEqual(admin_response.status_code, 200)
        observed_count = len(admin_response.data)
        expected_count = ScanReport.objects.all().count()

        # Assert the observed results are the same as the expected
        self.assertEqual(observed_count, expected_count)

        # user who is not the author of a scan report
        non_az_user = User.objects.create(username="saruman", password="fiwuenfwinefiw")
        self.project.members.add(non_az_user)

        # Get data admin_user should be able to see
        self.client.force_authenticate(non_az_user)
        admin_response = self.client.get("/api/scanreports/")
        self.assertEqual(admin_response.status_code, 200)
        observed_objs = sorted([obj.get("id") for obj in admin_response.data])
        expected_objs = sorted([self.scanreport1.id])

        # Assert the observed results are the same as the expected
        self.assertListEqual(observed_objs, expected_objs)


# class TestScanReportRetrieveView(TestCase):
#     def setUp(self):
#         User = get_user_model()
#         # Set up users
#         self.ds_admin_user = User.objects.create(
#             username="gandalf", password="hjfiwejfiwef"
#         )
#         Token.objects.create(user=self.ds_admin_user)
#         self.non_ds_admin_user = User.objects.create(
#             username="aragorn", password="djfoiejwiofjoiewf"
#         )
#         Token.objects.create(user=self.non_ds_admin_user)
#         self.non_project_user = User.objects.create(
#             username="bilbo", password="djfoiejwiofjoiewf"
#         )
#         Token.objects.create(user=self.non_project_user)

#         # Set up Project
#         self.project = Project.objects.create(name="The Fellowship of the Ring")
#         self.project.members.add(self.ds_admin_user, self.non_ds_admin_user)

#         # Set up Dataset
#         self.dataset = Dataset.objects.create(
#             name="The Heights of Hobbits", visibility=VisibilityChoices.PUBLIC
#         )
#         self.dataset.admins.add(self.ds_admin_user)
#         self.project.datasets.add(self.dataset)

#         # Set up Scan Report
#         self.scan_report = ScanReport.objects.create(
#             dataset="The Rings of Power",
#             visibility=VisibilityChoices.RESTRICTED,
#             parent_dataset=self.dataset,
#         )
#         self.scan_report.viewers.add(self.non_ds_admin_user)

#         # Request factory for setting up requests
#         self.client = APIClient()

#     def test_non_ds_admin_member_can_see(self):
#         # Authenticate non ds admin user
#         self.client.force_authenticate(self.non_ds_admin_user)
#         #  Make the request
#         response = self.client.get(f"/api/scanreports/{self.scan_report.id}")
#         # Ensure non ds admin user can see
#         self.assertEqual(response.status_code, 200)

#     def test_ds_admin_member_can_see(self):
#         # Authenticate ds admin user
#         self.client.force_authenticate(self.ds_admin_user)
#         #  Make the request
#         response = self.client.get(f"/api/scanreports/{self.scan_report.id}")
#         # Ensure ds admin user can see
#         self.assertEqual(response.status_code, 200)

#     def test_non_project_member_forbidden(self):
#         # Authenticate non project user
#         self.client.force_authenticate(self.non_project_user)
#         #  Make the request
#         response = self.client.get(f"/api/scanreports/{self.scan_report.id}")
#         # Ensure non project user is Forbidden
#         self.assertEqual(response.status_code, 403)
