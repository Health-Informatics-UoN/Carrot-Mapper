import datetime
import logging
import os
import random
import string
from typing import Any
from urllib.parse import urljoin

import requests
from api.filters import ScanReportAccessFilter
from api.paginations import CustomPagination
from api.serializers import (
    ClassificationSystemSerializer,
    ConceptAncestorSerializer,
    ConceptClassSerializer,
    ConceptRelationshipSerializer,
    ConceptSerializer,
    ConceptSynonymSerializer,
    ContentTypeSerializer,
    DataDictionarySerializer,
    DataPartnerSerializer,
    DatasetAndDataPartnerViewSerializer,
    DatasetEditSerializer,
    DatasetViewSerializer,
    DomainSerializer,
    DrugStrengthSerializer,
    GetRulesAnalysis,
    GetRulesJSON,
    MappingRuleSerializer,
    OmopFieldSerializer,
    OmopTableSerializer,
    ProjectDatasetSerializer,
    ProjectNameSerializer,
    ProjectSerializer,
    ScanReportConceptSerializer,
    ScanReportCreateSerializer,
    ScanReportEditSerializer,
    ScanReportFieldEditSerializer,
    ScanReportFieldListSerializer,
    ScanReportFieldListSerializerV2,
    ScanReportFilesSerializer,
    ScanReportTableEditSerializer,
    ScanReportTableListSerializer,
    ScanReportTableListSerializerV2,
    ScanReportValueEditSerializer,
    ScanReportValueViewSerializer,
    ScanReportValueViewSerializerV2,
    ScanReportViewSerializer,
    ScanReportViewSerializerV2,
    UserSerializer,
    VocabularySerializer,
)
from azure.storage.blob import BlobServiceClient
from config import settings
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.db.models.query_utils import Q
from django.http import HttpResponse, JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from mapping.permissions import (
    CanAdmin,
    CanEdit,
    CanView,
    CanViewProject,
    get_user_permissions_on_dataset,
    get_user_permissions_on_scan_report,
)
from mapping.services import delete_blob, modify_filename, upload_blob
from mapping.services_rules import get_mapping_rules_list
from rest_framework import generics, status, viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from shared.data.models import (
    ClassificationSystem,
    DataDictionary,
    DataPartner,
    Dataset,
    MappingRule,
    OmopField,
    OmopTable,
    Project,
    ScanReport,
    ScanReportConcept,
    ScanReportField,
    ScanReportTable,
    ScanReportValue,
    VisibilityChoices,
)
from shared.data.omop import (
    Concept,
    ConceptAncestor,
    ConceptClass,
    ConceptRelationship,
    ConceptSynonym,
    Domain,
    DrugStrength,
    Vocabulary,
)
from shared.services.azurequeue import add_message
from shared.services.rules import (
    _find_destination_table,
    _save_mapping_rules,
    delete_mapping_rules,
)


class ConceptViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Concept.objects.all()
    serializer_class = ConceptSerializer


class ConceptFilterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Concept.objects.all()
    serializer_class = ConceptSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "concept_id": ["in", "exact"],
        "concept_code": ["in", "exact"],
        "vocabulary_id": ["in", "exact"],
    }


class ConceptFilterViewSetV2(viewsets.ReadOnlyModelViewSet):
    queryset = Concept.objects.all()
    serializer_class = ConceptSerializer
    filter_backends = [DjangoFilterBackend]
    pagination_class = CustomPagination
    filterset_fields = {
        "concept_id": ["in", "exact"],
        "concept_code": ["in", "exact"],
        "vocabulary_id": ["in", "exact"],
    }


class VocabularyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Vocabulary.objects.all()
    serializer_class = VocabularySerializer


class ConceptRelationshipViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ConceptRelationship.objects.all()
    serializer_class = ConceptRelationshipSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["concept_id_1", "concept_id_2", "relationship_id"]


class ConceptRelationshipFilterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ConceptRelationship.objects.all()
    serializer_class = ConceptRelationshipSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "concept_id_1": ["in", "exact"],
        "concept_id_2": ["in", "exact"],
        "relationship_id": ["in", "exact"],
    }


class ConceptAncestorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ConceptAncestor.objects.all()
    serializer_class = ConceptAncestorSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["ancestor_concept_id", "descendant_concept_id"]


class ConceptClassViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ConceptClass.objects.all()
    serializer_class = ConceptClassSerializer


class ConceptSynonymViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ConceptSynonym.objects.all()
    serializer_class = ConceptSynonymSerializer


class DomainViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Domain.objects.all()
    serializer_class = DomainSerializer


class DrugStrengthViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DrugStrength.objects.all()
    serializer_class = DrugStrengthSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["drug_concept_id", "ingredient_concept_id"]


class CountProjects(APIView):
    renderer_classes = (JSONRenderer,)

    def get(self, request, dataset):
        project_count = (
            Project.objects.filter(datasets__exact=dataset).distinct().count()
        )
        content = {
            "project_count": project_count,
        }
        return Response(content)


class ProjectListView(ListAPIView):
    """
    API view to show all projects' names.
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {"name": ["in", "exact"]}

    def get_serializer_class(self):
        if (
            self.request.GET.get("name") is not None
            or self.request.GET.get("name__in") is not None
        ):
            return ProjectSerializer
        if self.request.GET.get("datasets") is not None:
            return ProjectDatasetSerializer

        return ProjectNameSerializer

    def get_queryset(self):
        if dataset := self.request.GET.get("dataset"):
            return Project.objects.filter(
                datasets__exact=dataset, members__id=self.request.user.id
            ).distinct()

        return Project.objects.all()


class ProjectRetrieveView(RetrieveAPIView):
    """
    API view to retrieve a single project.
    Will return 403 Forbidden if User isn't a member.
    """

    permission_classes = [CanViewProject]
    serializer_class = ProjectSerializer
    queryset = Project.objects.all()


class ProjectUpdateView(generics.UpdateAPIView):
    serializer_class = ProjectSerializer
    queryset = Project.objects.all()


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class UserFilterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {"id": ["in", "exact"], "is_active": ["exact"]}


class ScanReportListViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {"parent_dataset": ["exact"]}

    def get_permissions(self):
        if self.request.method == "DELETE":
            # user must be able to view and be an admin to delete a scan report
            self.permission_classes = [IsAuthenticated & CanView & CanAdmin]
        elif self.request.method in ["PUT", "PATCH"]:
            # user must be able to view and be either an editor or and admin
            # to edit a scan report
            self.permission_classes = [IsAuthenticated & CanView & (CanEdit | CanAdmin)]
        else:
            self.permission_classes = [IsAuthenticated & (CanView | CanEdit | CanAdmin)]
        return [permission() for permission in self.permission_classes]

    def get_serializer_class(self):
        if self.request.method in ["GET", "POST"]:
            # use the view serialiser if on GET requests
            return ScanReportViewSerializer
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            # use the edit serialiser when the user tries to alter the scan report
            return ScanReportEditSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        """
        If the User is the `AZ_FUNCTION_USER`, return all ScanReports.

        Else, apply the correct rules regarding the visibility of the Dataset and SR,
        and the membership of the User of viewer/editor/admin/author for either.
        """
        if self.request.user.username == os.getenv("AZ_FUNCTION_USER"):
            return ScanReport.objects.all().distinct()

        return ScanReport.objects.filter(
            (
                Q(parent_dataset__visibility=VisibilityChoices.PUBLIC)
                & (
                    Q(
                        # Dataset and SR are 'PUBLIC'
                        visibility=VisibilityChoices.PUBLIC,
                    )
                    | (
                        Q(visibility=VisibilityChoices.RESTRICTED)
                        & (
                            Q(
                                # Dataset is public
                                # SR is restricted but user is in SR viewers
                                viewers=self.request.user.id,
                            )
                            | Q(
                                # Dataset is public
                                # SR is restricted but user is in SR editors
                                editors=self.request.user.id,
                            )
                            | Q(
                                # Dataset is public
                                # SR is restricted but user is SR author
                                author=self.request.user.id,
                            )
                            | Q(
                                # Dataset is public
                                # SR is restricted but user is in Dataset editors
                                parent_dataset__editors=self.request.user.id,
                            )
                            | Q(
                                # Dataset is public
                                # SR is restricted but user is in Dataset admins
                                parent_dataset__admins=self.request.user.id,
                            )
                        )
                    )
                )
            )
            | (
                Q(parent_dataset__visibility=VisibilityChoices.RESTRICTED)
                & (
                    Q(
                        # Dataset and SR are restricted
                        # User is in Dataset admins
                        parent_dataset__admins=self.request.user.id,
                    )
                    | Q(
                        # Dataset and SR are restricted
                        # User is in Dataset editors
                        parent_dataset__editors=self.request.user.id,
                    )
                    | (
                        Q(parent_dataset__viewers=self.request.user.id)
                        & (
                            Q(
                                # Dataset and SR are restricted
                                # User is in Dataset viewers and SR viewers
                                viewers=self.request.user.id,
                            )
                            | Q(
                                # Dataset and SR are restricted
                                # User is in Dataset viewers and SR editors
                                editors=self.request.user.id,
                            )
                            | Q(
                                # Dataset and SR are restricted
                                # User is in Dataset viewers and SR author
                                author=self.request.user.id,
                            )
                            | Q(
                                # Dataset is restricted
                                # But SR is 'PUBLIC'
                                visibility=VisibilityChoices.PUBLIC,
                            )
                        )
                    )
                )
            ),
            parent_dataset__project__members=self.request.user.id,
        ).distinct()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data, many=isinstance(request.data, list)
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class ScanReportListViewSetV2(ScanReportListViewSet):
    """
    A custom viewset for retrieving and listing scan reports with additional functionality for version 2.

    Remarks:
    - This viewset extends ScanReportListViewSet and provides custom behavior listing scan reports.
    - Includes custom filtering, ordering, and pagination.
    """

    parser_classes = [MultiPartParser, FormParser]

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = {
        "hidden": ["exact"],
        "dataset": ["in", "icontains"],
        "status": ["in"],
        "parent_dataset": ["exact"],
    }
    ordering_fields = ["id", "name", "created_at", "dataset", "data_partner"]
    pagination_class = CustomPagination
    ordering = "-created_at"

    def get_scan_report_file(self, request):
        scan_report_file = request.data.get("scan_report_file", None)
        return scan_report_file

    def get_serializer_class(self):
        if self.request.method in ["GET"]:
            return ScanReportViewSerializerV2
        if self.request.method in ["POST"]:
            return ScanReportFilesSerializer
        if self.request.method in ["DELETE"]:
            return ScanReportEditSerializer
        return super().get_serializer_class()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        try:
            delete_blob(instance.name, "scan-reports")
        except Exception as e:
            raise Exception(f"Error deleting scan report: {e}")
        if instance.data_dictionary:
            try:
                delete_blob(instance.data_dictionary.name, "data-dictionaries")
            except Exception as e:
                raise Exception(f"Error deleting data dictionary: {e}")
        instance.delete()

    def create(self, request, *args, **kwargs):
        non_file_serializer = ScanReportCreateSerializer(
            data=request.data, context={"request": request}
        )
        if not non_file_serializer.is_valid():
            return Response(
                non_file_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        file_serializer = self.get_serializer(data=request.FILES)
        if not file_serializer.is_valid():
            return Response(file_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(file_serializer, non_file_serializer)
        headers = self.get_success_headers(file_serializer.data)
        return Response(
            file_serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def perform_create(self, serializer, non_file_serializer):
        validatedFiles = serializer.validated_data
        validatedData = non_file_serializer.validated_data
        # List all the validated data and files
        valid_data_dictionary_file = validatedFiles.get("data_dictionary_file")
        valid_scan_report_file = validatedFiles.get("scan_report_file")
        valid_visibility = validatedData.get("visibility")
        valid_editors = validatedData.get("editors")
        valid_dataset = validatedData.get("dataset")
        valid_parent_dataset = validatedData.get("parent_dataset")

        rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
        dt = "{:%Y%m%d-%H%M%S}".format(datetime.datetime.now())

        # Create an entry in ScanReport for the uploaded Scan Report
        scan_report = ScanReport.objects.create(
            dataset=valid_dataset,
            parent_dataset=valid_parent_dataset,
            name=modify_filename(valid_scan_report_file, dt, rand),
            visibility=valid_visibility,
        )

        scan_report.author = self.request.user
        scan_report.save()

        # Add editors to the scan report if specified
        if sr_editors := valid_editors:
            scan_report.editors.add(*sr_editors)

        # If there's no data dictionary supplied, only upload the scan report
        # Set data_dictionary_blob in Azure message to None
        if str(valid_data_dictionary_file) == "undefined":
            azure_dict = {
                "scan_report_id": scan_report.id,
                "scan_report_blob": scan_report.name,
                "data_dictionary_blob": "None",
            }

            upload_blob(
                scan_report.name,
                "scan-reports",
                valid_scan_report_file,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )

        else:
            data_dictionary = DataDictionary.objects.create(
                name=f"{os.path.splitext(str(valid_data_dictionary_file))[0]}"
                f"_{dt}{rand}.csv"
            )
            data_dictionary.save()
            scan_report.data_dictionary = data_dictionary
            scan_report.save()

            azure_dict = {
                "scan_report_id": scan_report.id,
                "scan_report_blob": scan_report.name,
                "data_dictionary_blob": data_dictionary.name,
            }

            upload_blob(
                scan_report.name,
                "scan-reports",
                valid_scan_report_file,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            upload_blob(
                data_dictionary.name,
                "data-dictionaries",
                valid_data_dictionary_file,
                "text/csv",
            )

        # send to the upload queue
        add_message(os.environ.get("UPLOAD_QUEUE_NAME"), azure_dict)


class DatasetListView(generics.ListAPIView):
    """
    API view to show all datasets.
    """

    serializer_class = DatasetViewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "id": ["in"],
        "data_partner": ["in", "exact"],
        "hidden": ["in", "exact"],
    }

    def get_queryset(self):
        """
        If the User is the `AZ_FUNCTION_USER`, return all Datasets.

        Else, return only the Datasets which are on projects a user is a member,
        which are "PUBLIC", or "RESTRICTED" Datasets that a user is a viewer of.
        """
        if self.request.user.username == os.getenv("AZ_FUNCTION_USER"):
            return Dataset.objects.all().distinct()

        return Dataset.objects.filter(
            Q(visibility=VisibilityChoices.PUBLIC)
            | Q(
                viewers=self.request.user.id,
                visibility=VisibilityChoices.RESTRICTED,
            )
            | Q(
                editors=self.request.user.id,
                visibility=VisibilityChoices.RESTRICTED,
            )
            | Q(
                admins=self.request.user.id,
                visibility=VisibilityChoices.RESTRICTED,
            ),
            project__members=self.request.user.id,
        ).distinct()


class DatasetAndDataPartnerListView(generics.ListAPIView):
    """
    API view to show all datasets.
    """

    serializer_class = DatasetAndDataPartnerViewSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ["id", "name", "created_at", "visibility", "data_partner"]
    filterset_fields = {
        "id": ["in"],
        "hidden": ["in", "exact"],
        "name": ["in", "icontains"],
    }
    ordering = "-created_at"

    def get_queryset(self):
        """
        If the User is the `AZ_FUNCTION_USER`, return all Datasets.

        Else, return only the Datasets which are on projects a user is a member,
        which are "PUBLIC", or "RESTRICTED" Datasets that a user is a viewer of.
        """

        if self.request.user.username == os.getenv("AZ_FUNCTION_USER"):
            return Dataset.objects.prefetch_related("data_partner").all().distinct()

        return (
            Dataset.objects.filter(
                Q(visibility=VisibilityChoices.PUBLIC)
                | Q(
                    viewers=self.request.user.id,
                    visibility=VisibilityChoices.RESTRICTED,
                )
                | Q(
                    editors=self.request.user.id,
                    visibility=VisibilityChoices.RESTRICTED,
                )
                | Q(
                    admins=self.request.user.id,
                    visibility=VisibilityChoices.RESTRICTED,
                ),
                project__members=self.request.user.id,
            )
            .prefetch_related("data_partner")
            .distinct()
            .order_by("-id")
        )


class DatasetCreateView(generics.CreateAPIView):
    serializer_class = DatasetViewSerializer
    queryset = Dataset.objects.all()

    def perform_create(self, serializer):
        admins = serializer.initial_data.get("admins")
        # If no admins given, add the user uploading the dataset
        if not admins:
            serializer.save(admins=[self.request.user])
        # If the user is not in the admins, add them
        elif self.request.user.id not in admins:
            serializer.save(admins=admins + [self.request.user.id])
        # All is well, save
        else:
            serializer.save()


class DatasetRetrieveView(generics.RetrieveAPIView):
    """
    This view should return a single dataset from an id
    """

    serializer_class = DatasetViewSerializer
    permission_classes = [CanView | CanAdmin | CanEdit]

    def get_queryset(self):
        return Dataset.objects.filter(id=self.kwargs.get("pk"))


class DatasetUpdateView(generics.UpdateAPIView):
    serializer_class = DatasetEditSerializer
    # User must be able to view and be an admin or an editor
    permission_classes = [CanView & (CanAdmin | CanEdit)]

    def get_queryset(self):
        return Dataset.objects.filter(id=self.kwargs.get("pk"))

    def get_serializer_context(self):
        return {"projects": self.request.data.get("projects")}


class DatasetDeleteView(generics.DestroyAPIView):
    serializer_class = DatasetEditSerializer
    # User must be able to view and be an admin
    permission_classes = [CanView & CanAdmin]

    def get_queryset(self):
        return Dataset.objects.filter(id=self.kwargs.get("pk"))


class ScanReportTableViewSet(viewsets.ModelViewSet):
    queryset = ScanReportTable.objects.all()
    filter_backends = [DjangoFilterBackend, OrderingFilter, ScanReportAccessFilter]
    ordering_fields = ["name", "person_id", "event_date"]
    filterset_fields = {
        "scan_report": ["in", "exact"],
        "name": ["in", "icontains"],
        "id": ["in", "exact"],
    }

    ordering = "-created_at"

    def get_permissions(self):
        if self.request.method == "DELETE":
            # user must be able to view and be an admin to delete a scan report
            self.permission_classes = [IsAuthenticated & CanView & CanAdmin]
        elif self.request.method in ["PUT", "PATCH"]:
            # user must be able to view and be either an editor or and admin
            # to edit a scan report
            self.permission_classes = [IsAuthenticated & CanView & (CanEdit | CanAdmin)]
        else:
            self.permission_classes = [IsAuthenticated & (CanView | CanEdit | CanAdmin)]
        return [permission() for permission in self.permission_classes]

    def get_serializer_class(self):
        if self.request.method in ["GET", "POST"]:
            # use the view serialiser if on GET requests
            return ScanReportTableListSerializer
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            # use the edit serialiser when the user tries to alter the scan report
            return ScanReportTableEditSerializer
        return super().get_serializer_class()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data, many=isinstance(request.data, list)
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def partial_update(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        """
        Perform a partial update on the instance.

        Args:
            request (Any): The request object.
            *args (Any): Additional positional arguments.
            **kwargs (Any): Additional keyword arguments.

        Returns:
            Response: The response object.
        """
        instance = self.get_object()
        partial = kwargs.pop("partial", True)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Delete the current mapping rules
        delete_mapping_rules(instance.id)

        # Map the table
        scan_report_instance = instance.scan_report
        data_dictionary_name = (
            scan_report_instance.data_dictionary.name
            if scan_report_instance.data_dictionary
            else None
        )

        # Send to functions
        msg = {
            "scan_report_id": scan_report_instance.id,
            "table_id": instance.id,
            "data_dictionary_blob": data_dictionary_name,
        }
        base_url = f"{settings.AZ_URL}"
        trigger = (
            f"/api/orchestrators/{settings.AZ_RULES_NAME}?code={settings.AZ_RULES_KEY}"
        )
        try:
            response = requests.post(urljoin(base_url, trigger), json=msg)
            response.raise_for_status()
        except request.exceptions.HTTPError as e:
            logging.error(f"HTTP Trigger failed: {e}")

        # TODO: The worker_id can be used for status, but we need to save it somewhere.
        # resp_json = response.json()
        # worker_id = resp_json.get("instanceId")

        return Response(serializer.data)


class ScanReportTableViewSetV2(ScanReportTableViewSet):
    filterset_fields = {
        "scan_report": ["in", "exact"],
        "name": ["in", "icontains"],
        "id": ["in", "exact"],
    }
    filter_backends = [DjangoFilterBackend, OrderingFilter, ScanReportAccessFilter]
    ordering_fields = ["name", "person_id", "date_event"]
    pagination_class = CustomPagination

    def get_serializer_class(self):
        if self.request.method in ["GET", "POST"]:
            # use the view serialiser if on GET requests
            return ScanReportTableListSerializerV2
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            # use the edit serialiser when the user tries to alter the scan report
            return ScanReportTableEditSerializer
        return super().get_serializer_class()


class ScanReportFieldViewSet(viewsets.ModelViewSet):
    queryset = ScanReportField.objects.all()
    filter_backends = [DjangoFilterBackend, ScanReportAccessFilter]
    filterset_fields = {
        "scan_report_table": ["in", "exact"],
        "name": ["in", "exact"],
    }

    def get_permissions(self):
        if self.request.method == "DELETE":
            # user must be able to view and be an admin to delete a scan report
            self.permission_classes = [IsAuthenticated & CanView & CanAdmin]
        elif self.request.method in ["PUT", "PATCH"]:
            # user must be able to view and be either an editor or and admin
            # to edit a scan report
            self.permission_classes = [IsAuthenticated & CanView & (CanEdit | CanAdmin)]
        else:
            self.permission_classes = [IsAuthenticated & CanView | CanEdit | CanAdmin]
        return [permission() for permission in self.permission_classes]

    def get_serializer_class(self):
        if self.request.method in ["GET", "POST"]:
            # use the view serialiser if on GET requests
            return ScanReportFieldListSerializer
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            # use the edit serialiser when the user tries to alter the scan report
            return ScanReportFieldEditSerializer
        return super().get_serializer_class()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data, many=isinstance(request.data, list)
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class ScanReportFieldViewSetV2(ScanReportFieldViewSet):
    filterset_fields = {
        "scan_report_table": ["in", "exact"],
        "name": ["in", "icontains"],
    }
    filter_backends = [DjangoFilterBackend, OrderingFilter, ScanReportAccessFilter]
    ordering_fields = ["name", "description_column", "type_column"]
    pagination_class = CustomPagination
    ordering = "name"

    def get_serializer_class(self):
        if self.request.method in ["GET", "POST"]:
            # use the view serialiser if on GET requests
            return ScanReportFieldListSerializerV2
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            # use the edit serialiser when the user tries to alter the scan report
            return ScanReportFieldEditSerializer
        return super().get_serializer_class()


class ScanReportConceptViewSet(viewsets.ModelViewSet):
    queryset = ScanReportConcept.objects.all()
    serializer_class = ScanReportConceptSerializer

    def create(self, request, *args, **kwargs):
        body = request.data
        if not isinstance(body, list):
            # Extract the content_type
            content_type_str = body.pop("content_type", None)
            content_type = ContentType.objects.get(model=content_type_str)
            body["content_type"] = content_type.id

            concept = ScanReportConcept.objects.filter(
                concept=body["concept"],
                object_id=body["object_id"],
                content_type=content_type,
            )
            if concept.count() > 0:
                print("Can't add multiple concepts of the same id to the same object")
                response = JsonResponse(
                    {
                        "status_code": 403,
                        "ok": False,
                        "statusText": "Can't add multiple concepts of the same id to the same object",
                    }
                )
                response.status_code = 403
                return response
        else:
            # for each item in the list, identify any existing SRConcepts that clash, and block their creation
            # this method may be quite slow as it has to wait for each query
            filtered = []
            for item in body:
                # Extract the content_type
                content_type_str = item.pop("content_type", None)
                content_type = ContentType.objects.get(model=content_type_str)
                item["content_type"] = content_type.id

                concept = ScanReportConcept.objects.filter(
                    concept=item["concept"],
                    object_id=item["object_id"],
                    content_type=content_type,
                )
                if concept.count() == 0:
                    filtered.append(item)
            body = filtered

        serializer = self.get_serializer(data=body, many=isinstance(body, list))
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class ScanReportConceptViewSetV2(viewsets.ModelViewSet):
    """
    Version V2.
    """

    queryset = ScanReportConcept.objects.all()
    serializer_class = ScanReportConceptSerializer

    def create(self, request, *args, **kwargs):
        body = request.data

        # Extract the content_type
        content_type_str = body.pop("content_type", None)
        content_type = ContentType.objects.get(model=content_type_str)
        body["content_type"] = content_type.id

        # validate person_id and date event are set on table
        table_id = body.pop("table_id", None)
        try:
            table = ScanReportTable.objects.get(pk=table_id)
        except ObjectDoesNotExist:
            return Response(
                {"detail": "Table with the provided ID does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not table.person_id and not table.date_event:
            return Response(
                {"detail": "Please set both person_id and date_event on the table."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif not table.person_id:
            return Response(
                {"detail": "Please set the person_id on the table."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif not table.date_event:
            return Response(
                {"detail": "Please set the date_event on the table."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # validate that the concept exists.
        concept_id = body.get("concept", None)
        try:
            concept = Concept.objects.get(pk=concept_id)
        except ObjectDoesNotExist:
            return Response(
                {"detail": f"Concept id {concept_id} does not exist in our database."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # validate the destination_table
        destination_table = _find_destination_table(concept)
        if destination_table is None:
            return Response(
                {
                    "detail": "The destination table could not be found or has not been implemented."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate that multiple concepts are not being added.
        sr_concept = ScanReportConcept.objects.filter(
            concept=body["concept"],
            object_id=body["object_id"],
            content_type=content_type,
        )
        if sr_concept.count() > 0:
            return Response(
                {
                    "detail": "Can't add multiple concepts of the same id to the same object"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=body, many=isinstance(body, list))
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        model = serializer.instance
        saved = _save_mapping_rules(model)
        if not saved:
            return Response(
                {"detail": "Rule could not be saved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class ScanReportConceptFilterViewSet(viewsets.ModelViewSet):
    queryset = ScanReportConcept.objects.all()
    serializer_class = ScanReportConceptSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "concept__concept_id": ["in", "exact"],
        "object_id": ["in", "exact"],
        "id": ["in", "exact"],
        "content_type": ["in", "exact"],
    }


class ScanReportConceptFilterViewSetV2(viewsets.ModelViewSet):
    queryset = ScanReportConcept.objects.all()
    serializer_class = ScanReportConceptSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "concept__concept_id": ["in", "exact"],
        "object_id": ["in", "exact"],
        "id": ["in", "exact"],
        "content_type": ["in", "exact"],
    }


class ClassificationSystemViewSet(viewsets.ModelViewSet):
    queryset = ClassificationSystem.objects.all()
    serializer_class = ClassificationSystemSerializer


class DataDictionaryViewSet(viewsets.ModelViewSet):
    queryset = DataDictionary.objects.all()
    serializer_class = DataDictionarySerializer


class DataPartnerViewSet(viewsets.ModelViewSet):
    queryset = DataPartner.objects.all()
    serializer_class = DataPartnerSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data, many=isinstance(request.data, list)
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class DataPartnerFilterViewSet(viewsets.ModelViewSet):
    queryset = DataPartner.objects.all()
    serializer_class = DataPartnerSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["name"]


class OmopTableViewSet(viewsets.ModelViewSet):
    queryset = OmopTable.objects.all()
    serializer_class = OmopTableSerializer


class OmopTableFilterViewSet(viewsets.ModelViewSet):
    queryset = OmopTable.objects.all()
    serializer_class = OmopTableSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {"id": ["in", "exact"]}


class OmopFieldViewSet(viewsets.ModelViewSet):
    queryset = OmopField.objects.all()
    serializer_class = OmopFieldSerializer


class OmopFieldFilterViewSet(viewsets.ModelViewSet):
    queryset = OmopField.objects.all()
    serializer_class = OmopFieldSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {"id": ["in", "exact"]}


class MappingRuleViewSet(viewsets.ModelViewSet):
    queryset = MappingRule.objects.all()
    serializer_class = MappingRuleSerializer


class DownloadJSON(viewsets.ModelViewSet):
    queryset = ScanReport.objects.all()
    serializer_class = GetRulesJSON
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["id"]


class RulesList(viewsets.ModelViewSet):
    queryset = MappingRule.objects.all().order_by("id")
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend]
    http_method_names = ["get"]

    def get_queryset(self):
        _id = self.request.query_params.get("id", None)
        queryset = self.queryset
        if _id is not None:
            queryset = queryset.filter(scan_report__id=_id)
        return queryset

    def list(self, request):
        """
        This is a somewhat strange way of doing things (because we don't use a serializer class,
        but seems to be a limitation of how django handles the combination of pagination and
        filtering on ID of a model (ScanReport) that's not that being returned (MappingRule).

        Instead, this is in effect a ListSerializer for MappingRule but that only works for in
        the scenario we have. This means that get_mapping_rules_list() must now handle pagination
        directly.
        """
        queryset = self.queryset
        _id = self.request.query_params.get("id", None)
        # Filter on ScanReport ID
        if _id is not None:
            queryset = queryset.filter(scan_report__id=_id)
        count = queryset.count()

        # Get subset of mapping rules that fit onto the page to be displayed
        p = self.request.query_params.get("p", None)
        page_size = self.request.query_params.get("page_size", None)
        rules = get_mapping_rules_list(
            queryset, page_number=int(p), page_size=int(page_size)
        )

        # Process all rules
        for rule in rules:
            rule["destination_table"] = {
                "id": int(str(rule["destination_table"])),
                "name": rule["destination_table"].table,
            }

            rule["destination_field"] = {
                "id": int(str(rule["destination_field"])),
                "name": rule["destination_field"].field,
            }

            rule["domain"] = {
                "name": rule["domain"],
            }

            rule["source_table"] = {
                "id": int(str(rule["source_table"])),
                "name": rule["source_table"].name,
            }

            rule["source_field"] = {
                "id": int(str(rule["source_field"])),
                "name": rule["source_field"].name,
            }

        return Response(data={"count": count, "results": rules})


class AnalyseRules(viewsets.ModelViewSet):
    queryset = ScanReport.objects.all()
    serializer_class = GetRulesAnalysis
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["id"]


class MappingRuleFilterViewSet(viewsets.ModelViewSet):
    queryset = MappingRule.objects.all()
    serializer_class = MappingRuleSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "scan_report": ["in", "exact"],
        "concept": ["in", "exact"],
    }


class ScanReportValueViewSet(viewsets.ModelViewSet):
    queryset = ScanReportValue.objects.all()
    filter_backends = [DjangoFilterBackend, ScanReportAccessFilter]
    filterset_fields = {
        "scan_report_field": ["in", "exact"],
        "value": ["in", "exact"],
        "id": ["in", "exact"],
    }
    ordering = "id"

    def get_permissions(self):
        if self.request.method == "DELETE":
            # user must be able to view and be an admin to delete a scan report
            self.permission_classes = [IsAuthenticated & CanView & CanAdmin]
        elif self.request.method in ["PUT", "PATCH"]:
            # user must be able to view and be either an editor or and admin
            # to edit a scan report
            self.permission_classes = [IsAuthenticated & CanView & (CanEdit | CanAdmin)]
        else:
            self.permission_classes = [IsAuthenticated & (CanView | CanEdit | CanAdmin)]
        return [permission() for permission in self.permission_classes]

    def get_serializer_class(self):
        if self.request.method in ["GET", "POST"]:
            # use the view serialiser if on GET requests
            return ScanReportValueViewSerializer
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            # use the edit serialiser when the user tries to alter the scan report
            return ScanReportValueEditSerializer
        return super().get_serializer_class()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data, many=isinstance(request.data, list)
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class ScanReportValueViewSetV2(ScanReportValueViewSet):
    filterset_fields = {
        "scan_report_field": ["in", "exact"],
        "value": ["in", "icontains"],
    }
    filter_backends = [DjangoFilterBackend, OrderingFilter, ScanReportAccessFilter]
    ordering_fields = ["value", "value_description", "frequency"]
    pagination_class = CustomPagination

    def get_serializer_class(self):
        if self.request.method in ["GET", "POST"]:
            # use the view serialiser if on GET requests
            return ScanReportValueViewSerializerV2
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            # use the edit serialiser when the user tries to alter the scan report
            return ScanReportValueEditSerializer
        return super().get_serializer_class()


class ScanReportValuesFilterViewSetScanReport(viewsets.ModelViewSet):
    serializer_class = ScanReportValueViewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["scan_report_field__scan_report_table__scan_report"]

    def get_queryset(self):
        return ScanReportValue.objects.filter(
            scan_report_field__scan_report_table__scan_report=self.request.GET[
                "scan_report"
            ]
        )


class CountStats(APIView):
    renderer_classes = (JSONRenderer,)

    def get(self, request, format=None):
        scanreport_count = ScanReport.objects.count()
        scanreporttable_count = ScanReportTable.objects.count()
        scanreportfield_count = ScanReportField.objects.count()
        scanreportvalue_count = ScanReportValue.objects.count()
        scanreportmappingrule_count = MappingRule.objects.count()
        content = {
            "scanreport_count": scanreport_count,
            "scanreporttable_count": scanreporttable_count,
            "scanreportfield_count": scanreportfield_count,
            "scanreportvalue_count": scanreportvalue_count,
            "scanreportmappingrule_count": scanreportmappingrule_count,
        }
        return Response(content)


class CountStatsScanReport(APIView):
    renderer_classes = (JSONRenderer,)

    def get(self, request, format=None):
        parameterlist = list(
            map(int, self.request.query_params["scan_report"].split(","))
        )
        jsonrecords = []
        scanreporttable_count = "Disabled"
        scanreportfield_count = "Disabled"
        scanreportvalue_count = "Disabled"
        scanreportmappingrule_count = "Disabled"

        for scanreport in parameterlist:
            scanreport_content = {
                "scanreport": scanreport,
                "scanreporttable_count": scanreporttable_count,
                "scanreportfield_count": scanreportfield_count,
                "scanreportvalue_count": scanreportvalue_count,
                "scanreportmappingrule_count": scanreportmappingrule_count,
            }
            jsonrecords.append(scanreport_content)
        return Response(jsonrecords)


class CountStatsScanReportTable(APIView):
    renderer_classes = (JSONRenderer,)

    def get(self, request, format=None):
        parameterlist = list(
            map(int, self.request.query_params["scan_report_table"].split(","))
        )
        jsonrecords = []
        for scanreporttable in parameterlist:
            scanreportfield_count = ScanReportField.objects.filter(
                scan_report_table=scanreporttable
            ).count()
            scanreportvalue_count = ScanReportValue.objects.filter(
                scan_report_field__scan_report_table=scanreporttable
            ).count()

            scanreporttable_content = {
                "scanreporttable": scanreporttable,
                "scanreportfield_count": scanreportfield_count,
                "scanreportvalue_count": scanreportvalue_count,
            }
            jsonrecords.append(scanreporttable_content)
        return Response(jsonrecords)


class CountStatsScanReportTableField(APIView):
    renderer_classes = (JSONRenderer,)

    def get(self, request, format=None):
        parameterlist = list(
            map(int, self.request.query_params["scan_report_field"].split(","))
        )
        jsonrecords = []
        for scanreportfield in parameterlist:
            scanreportvalue_count = ScanReportValue.objects.filter(
                scan_report_field=scanreportfield
            ).count()
            scanreportfield_content = {
                "scanreportfield": scanreportfield,
                "scanreportvalue_count": scanreportvalue_count,
            }
            jsonrecords.append(scanreportfield_content)
        return Response(jsonrecords)


class GetContentTypeID(APIView):

    def get(self, request, *args, **kwargs):
        """
        Retrieves the content type ID based on the provided type name.

        Args:
            self: The instance of the class.
            request: The HTTP request object.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.
        """
        serializer = ContentTypeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        type_name = serializer.validated_data.get("type_name")
        try:
            content_type = ContentType.objects.get(model=type_name)
            return Response({"content_type_id": content_type.id})
        except ContentType.DoesNotExist:
            return Response({"error": "Content type not found"}, status=404)


class DownloadScanReportViewSet(viewsets.ViewSet):
    def list(self, request, pk):
        scan_report = ScanReport.objects.get(id=pk)
        # scan_report = ScanReportSerializer(scan_reports, many=False).data
        # Set Storage Account connection string
        print(scan_report)
        # TODO: `name` is not always defined, it seems
        blob_name = scan_report.name
        print(blob_name)
        container = "scan-reports"
        blob_service_client = BlobServiceClient.from_connection_string(
            os.environ.get("STORAGE_CONN_STRING")
        )

        # Grab scan report data from blob
        streamdownloader = (
            blob_service_client.get_container_client(container)
            .get_blob_client(blob_name)
            .download_blob()
        )
        scan_report = streamdownloader.readall()

        response = HttpResponse(
            scan_report,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{blob_name}"'

        return response


class ScanReportPermissionView(APIView):
    """
    API for permissions a user has on a specific scan report.
    """

    def get(self, request, pk):
        permissions = get_user_permissions_on_scan_report(request, pk)

        return Response({"permissions": permissions}, status=status.HTTP_200_OK)


class DatasetPermissionView(APIView):
    """
    API for permissions a user has on a specific dataset.
    """

    def get(self, request, pk):
        permissions = get_user_permissions_on_dataset(request, pk)

        return Response({"permissions": permissions}, status=status.HTTP_200_OK)
