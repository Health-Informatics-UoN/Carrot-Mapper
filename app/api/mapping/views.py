import base64
import datetime
import json
import os
import random
import string
from typing import Any

from azure.storage.blob import BlobServiceClient, ContentSettings
from azure.storage.queue import QueueClient
from data.models import (
    Concept,
    ConceptAncestor,
    ConceptClass,
    ConceptRelationship,
    ConceptSynonym,
    Domain,
    DrugStrength,
    Vocabulary,
)
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm, PasswordResetForm
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.views import PasswordChangeDoneView
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.core.mail import BadHeaderError, send_mail
from django.db.models.query_utils import Q
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.template.loader import render_to_string
from django.urls import reverse, reverse_lazy
from django.utils.decorators import method_decorator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from django.views.generic import ListView
from django.views.generic.edit import FormView, UpdateView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, viewsets
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from .forms import ScanReportAssertionForm, ScanReportForm
from .models import (
    ClassificationSystem,
    DataDictionary,
    DataPartner,
    Dataset,
    MappingRule,
    OmopField,
    OmopTable,
    Project,
    ScanReport,
    ScanReportAssertion,
    ScanReportConcept,
    ScanReportField,
    ScanReportTable,
    ScanReportValue,
    VisibilityChoices,
)
from .paginations import CustomPagination
from .permissions import (
    CanAdmin,
    CanEdit,
    CanView,
    CanViewProject,
    has_editorship,
    has_viewership,
    is_admin,
)
from .serializers import (
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
    ScanReportEditSerializer,
    ScanReportFieldEditSerializer,
    ScanReportFieldListSerializer,
    ScanReportTableEditSerializer,
    ScanReportTableListSerializer,
    ScanReportValueEditSerializer,
    ScanReportValueViewSerializer,
    ScanReportViewSerializer,
    UserSerializer,
    VocabularySerializer,
)
from .services import download_data_dictionary_blob
from .services_nlp import start_nlp_field_level
from .services_rules import (
    download_mapping_rules,
    download_mapping_rules_as_csv,
    find_existing_scan_report_concepts,
    get_mapping_rules_list,
    m_allowed_tables,
    remove_mapping_rules,
    save_mapping_rules,
    view_mapping_rules,
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

    permission_classes = []
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
            self.permission_classes = [CanView & CanAdmin]
        elif self.request.method in ["PUT", "PATCH"]:
            # user must be able to view and be either an editor or and admin
            # to edit a scan report
            self.permission_classes = [CanView & (CanEdit | CanAdmin)]
        else:
            self.permission_classes = [CanView | CanEdit | CanAdmin]
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

        f = ScanReport.objects.filter(
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
        return f

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
        qs = Dataset.objects.filter(id=self.kwargs.get("pk"))
        return qs


class DatasetUpdateView(generics.UpdateAPIView):
    serializer_class = DatasetEditSerializer
    # User must be able to view and be an admin or an editor
    permission_classes = [CanView & (CanAdmin | CanEdit)]

    def get_queryset(self):
        qs = Dataset.objects.filter(id=self.kwargs.get("pk"))
        return qs


class DatasetDeleteView(generics.DestroyAPIView):
    serializer_class = DatasetEditSerializer
    # User must be able to view and be an admin
    permission_classes = [CanView & CanAdmin]

    def get_queryset(self):
        qs = Dataset.objects.filter(id=self.kwargs.get("pk"))
        return qs


class ScanReportTableViewSet(viewsets.ModelViewSet):
    queryset = ScanReportTable.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "scan_report": ["in", "exact"],
        "name": ["in", "exact"],
        "id": ["in", "exact"],
    }

    def get_permissions(self):
        if self.request.method == "DELETE":
            # user must be able to view and be an admin to delete a scan report
            self.permission_classes = [CanView & CanAdmin]
        elif self.request.method in ["PUT", "PATCH"]:
            # user must be able to view and be either an editor or and admin
            # to edit a scan report
            self.permission_classes = [CanView & (CanEdit | CanAdmin)]
        else:
            self.permission_classes = [CanView | CanEdit | CanAdmin]
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

        # Map the table
        # Check if this env should be Adding Concepts
        add_concepts = os.environ.get("UPLOAD_ONLY").lower() == "true"
        if add_concepts:
            scan_report_instance = instance.scan_report
            data_dictionary_name = (
                scan_report_instance.data_dictionary.name
                if scan_report_instance.data_dictionary
                else None
            )

            # Send to queue
            azure_dict = {
                "scan_report_id": scan_report_instance.id,
                "table_id": instance.id,
                "data_dictionary_blob": data_dictionary_name,
            }
            queue_message = json.dumps(azure_dict)
            message_bytes = queue_message.encode("ascii")
            base64_bytes = base64.b64encode(message_bytes)
            base64_message = base64_bytes.decode("ascii")

            queue = QueueClient.from_connection_string(
                conn_str=os.environ.get("STORAGE_CONN_STRING"),
                queue_name=os.environ.get("CREATE_CONCEPTS_QUEUE_NAME"),
            )
            queue.send_message(base64_message)

        return Response(serializer.data)


# class ScanReportTableFilterViewSet(viewsets.ModelViewSet):
#     queryset = ScanReportTable.objects.all()
#     serializer_class = ScanReportTableSerializer
#     filter_backends = [DjangoFilterBackend]
#     filterset_fields = {
#         "scan_report": ["in", "exact"],
#         "name": ["in", "exact"],
#         "id": ["in", "exact"],
#     }


class ScanReportFieldViewSet(viewsets.ModelViewSet):
    queryset = ScanReportField.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "scan_report_table": ["in", "exact"],
        "name": ["in", "exact"],
        "id": ["in", "exact"],
    }

    def get_permissions(self):
        if self.request.method == "DELETE":
            # user must be able to view and be an admin to delete a scan report
            self.permission_classes = [CanView & CanAdmin]
        elif self.request.method in ["PUT", "PATCH"]:
            # user must be able to view and be either an editor or and admin
            # to edit a scan report
            self.permission_classes = [CanView & (CanEdit | CanAdmin)]
        else:
            self.permission_classes = [CanView | CanEdit | CanAdmin]
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


# class ScanReportFieldFilterViewSet(viewsets.ModelViewSet):
#     queryset = ScanReportField.objects.all()
#     serializer_class = ScanReportFieldSerializer
#     filter_backends = [DjangoFilterBackend]
#     filterset_fields = {
#         "scan_report_table": ["in", "exact"],
#         "name": ["in", "exact"],
#         "id": ["in", "exact"],
#     }


class ScanReportConceptViewSet(viewsets.ModelViewSet):
    queryset = ScanReportConcept.objects.all()
    serializer_class = ScanReportConceptSerializer

    def create(self, request, *args, **kwargs):
        body = request.data
        if not isinstance(body, list):
            concept = ScanReportConcept.objects.filter(
                concept=body["concept"],
                object_id=body["object_id"],
                content_type=body["content_type"],
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
                concept = ScanReportConcept.objects.filter(
                    concept=item["concept"],
                    object_id=item["object_id"],
                    content_type=item["content_type"],
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


class ScanReportActiveConceptFilterViewSet(viewsets.ModelViewSet):
    """
    This returns details of ScanReportConcepts that have the given content_type and are
    in ScanReports that are "active" - that is, not hidden, with unhidden parent
    dataset, and marked with status "Mapping Complete".
    This is only retrievable by AZ_FUNCTION_USER.
    """

    serializer_class = ScanReportConceptSerializer
    filter_backends = [DjangoFilterBackend]
    # filterset_fields = ["content_type"]

    def get_queryset(self):
        if self.request.user.username != os.getenv("AZ_FUNCTION_USER"):
            raise PermissionDenied(
                "You do not have permission to access this resource."
            )
        # TODO: This is a problem.
        content_type_str = self.request.GET["content_type"]
        content_type = ContentType.objects.get(model=content_type_str)

        if content_type_str == "scanreportfield":
            # ScanReportField
            # we have SRCs with content_type 15, grab all SRFields in active SRs,
            # and then filter ScanReportConcepts by those object_ids
            field_ids = ScanReportField.objects.filter(
                scan_report_table__scan_report__hidden=False,
                scan_report_table__scan_report__parent_dataset__hidden=False,
                scan_report_table__scan_report__status="COMPLET",
            ).values_list("id", flat=True)
            return ScanReportConcept.objects.filter(
                content_type=content_type, object_id__in=field_ids
            )
        elif content_type_str == "scanreportvalue":
            # ScanReportValue
            # we have SRCs with content_type 17, grab all SRValues in active SRs,
            # and then filter ScanReportConcepts by those object_ids
            value_ids = ScanReportValue.objects.filter(
                scan_report_field__scan_report_table__scan_report__hidden=False,
                scan_report_field__scan_report_table__scan_report__parent_dataset__hidden=False,
                scan_report_field__scan_report_table__scan_report__status="COMPLET",
            ).values_list("id", flat=True)
            return ScanReportConcept.objects.filter(
                content_type=content_type, object_id__in=value_ids
            )
        return None


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
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "scan_report_field": ["in", "exact"],
        "value": ["in", "exact"],
        "id": ["in", "exact"],
    }

    def get_permissions(self):
        if self.request.method == "DELETE":
            # user must be able to view and be an admin to delete a scan report
            self.permission_classes = [CanView & CanAdmin]
        elif self.request.method in ["PUT", "PATCH"]:
            # user must be able to view and be either an editor or and admin
            # to edit a scan report
            self.permission_classes = [CanView & (CanEdit | CanAdmin)]
        else:
            self.permission_classes = [CanView | CanEdit | CanAdmin]
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


# class ScanReportValueFilterViewSet(viewsets.ModelViewSet):
#     queryset = ScanReportValue.objects.all()
#     serializer_class = ScanReportValueSerializer
#     filter_backends = [DjangoFilterBackend]
#     filterset_fields = {
#         "scan_report_field": ["in", "exact"],
#         "value": ["in", "exact"],
#         "id": ["in", "exact"],
#     }


class ScanReportFilterViewSet(viewsets.ModelViewSet):
    queryset = ScanReport.objects.all()
    serializer_class = ScanReportViewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "id": ["in", "exact"],
        "status": ["in", "exact"],
        "hidden": ["in", "exact"],
        "parent_dataset__hidden": ["in", "exact"],
    }


class ScanReportValuesFilterViewSetScanReport(viewsets.ModelViewSet):
    serializer_class = ScanReportValueViewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["scan_report_field__scan_report_table__scan_report"]

    def get_queryset(self):
        qs = ScanReportValue.objects.filter(
            scan_report_field__scan_report_table__scan_report=self.request.GET[
                "scan_report"
            ]
        )
        return qs


class ScanReportValuesFilterViewSetScanReportTable(viewsets.ModelViewSet):
    serializer_class = ScanReportValueViewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["scan_report_field__scan_report_table"]

    def get_queryset(self):
        qs = ScanReportValue.objects.filter(
            scan_report_field__scan_report_table=self.request.GET["scan_report_table"]
        )
        return qs


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
        for scanreport in parameterlist:
            scanreporttable_count = "Disabled"
            scanreportfield_count = "Disabled"
            scanreportvalue_count = "Disabled"
            scanreportmappingrule_count = "Disabled"

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


# This custom ModelViewSet returns all ScanReportValues for a given ScanReport
# It also removes all conceptIDs which == -1, leaving only those SRVs with a
# concept_id which has been looked up with omop_helpers
class ScanReportValuePKViewSet(viewsets.ModelViewSet):
    serializer_class = ScanReportValueViewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["scan_report_field__scan_report_table__scan_report"]

    def get_queryset(self):
        qs = ScanReportValue.objects.filter(
            scan_report_field__scan_report_table__scan_report=self.request.GET[
                "scan_report"
            ]
        ).exclude(conceptID=-1)
        return qs


class GetContentTypeID(APIView):
    """
    TODO: Add documentation
    """

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


@login_required
def home(request):
    return render(request, "mapping/home.html", {})


@login_required
def update_scanreport_table_page(request, sr, pk):
    try:
        # Get the SR table
        sr_table = ScanReportTable.objects.get(id=pk)
        # Determine if the user can edit the form
        can_edit = False
        if (
            sr_table.scan_report.author.id == request.user.id
            or sr_table.scan_report.editors.filter(id=request.user.id).exists()
            or sr_table.scan_report.parent_dataset.editors.filter(
                id=request.user.id
            ).exists()
            or sr_table.scan_report.parent_dataset.admins.filter(
                id=request.user.id
            ).exists()
        ):
            can_edit = True
        # Set the page context
        context = {"can_edit": can_edit, "pk": pk}
        if (
            has_viewership(sr_table, request)
            or has_editorship(sr_table, request)
            or is_admin(sr_table, request)
        ):
            return render(request, "mapping/scanreporttable_form.html", context=context)
        else:
            return render(request, "mapping/error_404.html")
    except ObjectDoesNotExist:
        return render(request, "mapping/error_404.html")


@method_decorator(login_required, name="dispatch")
class ScanReportListView(ListView):
    model = ScanReport
    # order the scanreports now so the latest is first in the table
    ordering = ["-created_at"]

    # handle and post methods
    # so far just handle a post when a button to click to hide/show a report
    def post(self, request, *args, **kwargs):
        # obtain the scanreport id from the buttont that is clicked
        _id = request.POST.get("scanreport_id")
        if _id is not None:
            # obtain the scan report based on this id
            report = ScanReport.objects.get(pk=_id)
            # switch hidden True -> False, or False -> True, if clicked
            report.hidden = not report.hidden
            # update the model
            report.save()
        # return to the same page
        return redirect(request.META["HTTP_REFERER"])

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)
        # add the current user to the context
        # this is needed so the hide/show buttons can be only turned on
        # by whoever created the report
        context["current_user"] = self.request.user
        context["filterset"] = self.filterset
        return context

    def get_queryset(self):
        search_term = self.request.GET.get("filter", None)
        qs = super().get_queryset()
        if search_term == "archived":
            qs = qs.filter(hidden=True)
            self.filterset = "Archived"
        else:
            qs = qs.filter(hidden=False)
            self.filterset = "Active"
        return qs


@method_decorator(login_required, name="dispatch")
class StructuralMappingTableListView(ListView):
    model = MappingRule
    template_name = "mapping/mappingrulesscanreport_list.html"

    def post(self, request, *args, **kwargs):
        try:
            body = json.loads(request.body.decode("utf-8"))
        except ValueError:
            body = {}
        if (
            request.POST.get("download_rules") is not None
            or body.get("download_rules", None) is not None
        ):
            qs = self.get_queryset()
            return download_mapping_rules(request, qs)
        elif (
            request.POST.get("download_rules_as_csv") is not None
            or body.get("download_rules_as_csv", None) is not None
        ):
            qs = self.get_queryset()
            return download_mapping_rules_as_csv(request, qs)
        elif (
            request.POST.get("refresh_rules") is not None
            or body.get("refresh_rules", None) is not None
        ):
            # remove all existing rules first
            remove_mapping_rules(request, self.kwargs.get("pk"))
            # get all associated ScanReportConcepts for this given ScanReport
            # this method could be taking too long to execute
            all_associated_concepts = find_existing_scan_report_concepts(
                request, self.kwargs.get("pk")
            )
            # save all of them
            nconcepts = 0
            nbadconcepts = 0
            for concept in all_associated_concepts:
                if save_mapping_rules(request, concept):
                    nconcepts += 1
                else:
                    nbadconcepts += 1

            if nbadconcepts == 0:
                messages.success(
                    request, f"Found and added rules for {nconcepts} existing concepts"
                )
            else:
                messages.success(
                    request,
                    f"Found and added rules for {nconcepts} existing concepts. However, couldnt add rules for {nbadconcepts} concepts.",
                )
            return redirect(request.path)

        elif (
            request.POST.get("get_svg") is not None
            or body.get("get_svg", None) is not None
        ):
            qs = self.get_queryset()
            return view_mapping_rules(request, qs)
        else:
            messages.error(request, "not working right now!")
            return redirect(request.path)

    def get_queryset(self):
        qs = super().get_queryset()
        search_term = self.kwargs.get("pk")

        if search_term is not None:
            qs = qs.filter(scan_report__id=search_term).order_by(
                "concept",
                "omop_field__table",
                "omop_field__field",
                "source_table__name",
                "source_field__name",
            )

        return qs


def modify_filename(filename, dt, rand):
    split_filename = os.path.splitext(str(filename))
    return f"{split_filename[0]}_{dt}_{rand}{split_filename[1]}"


@method_decorator(login_required, name="dispatch")
class ScanReportFormView(FormView):
    form_class = ScanReportForm
    template_name = "mapping/upload_scan_report.html"
    success_url = reverse_lazy("scan-report-list")

    def form_invalid(self, form):
        storage = messages.get_messages(self.request)
        for message in storage:
            response = JsonResponse(
                {
                    "status_code": 422,
                    "form-errors": form.errors,
                    "ok": False,
                    "statusText": str(message),
                }
            )
            response.status_code = 422
            return response
        response = JsonResponse(
            {
                "status_code": 422,
                "form-errors": form.errors,
                "ok": False,
                "statusText": "Could not process input.",
            }
        )
        response.status_code = 422
        return response

    def form_valid(self, form):
        # Check user has admin/editor rights on Scan Report parent dataset
        parent_dataset = form.cleaned_data["parent_dataset"]
        if not (
            has_editorship(parent_dataset, self.request)
            or is_admin(parent_dataset, self.request)
        ):
            messages.warning(
                self.request,
                "You do not have editor or administrator "
                "permissions on this Dataset.",
            )
            return self.form_invalid(form)

        # Create random alphanumeric to link scan report to data dictionary
        # Create datetime stamp for scan report and data dictionary upload time
        rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
        dt = "{:%Y%m%d-%H%M%S}".format(datetime.datetime.now())
        print(dt, rand)
        # Create an entry in ScanReport for the uploaded Scan Report
        scan_report = ScanReport.objects.create(
            dataset=form.cleaned_data["dataset"],
            parent_dataset=parent_dataset,
            name=modify_filename(form.cleaned_data.get("scan_report_file"), dt, rand),
            visibility=form.cleaned_data["visibility"],
        )

        scan_report.author = self.request.user
        scan_report.save()

        # Add viewers to the scan report if specified
        if sr_viewers := form.cleaned_data.get("viewers"):
            scan_report.viewers.add(*sr_viewers)

        # Add editors to the scan report if specified
        if sr_editors := form.cleaned_data.get("editors"):
            scan_report.editors.add(*sr_editors)

        # Grab Azure storage credentials
        blob_service_client = BlobServiceClient.from_connection_string(
            os.getenv("STORAGE_CONN_STRING")
        )

        print("FILE >>> ", str(form.cleaned_data.get("scan_report_file")))
        print("STRING TEST >>>> ", scan_report.name)

        # If there's no data dictionary supplied, only upload the scan report
        # Set data_dictionary_blob in Azure message to None
        if form.cleaned_data.get("data_dictionary_file") is None:
            azure_dict = {
                "scan_report_id": scan_report.id,
                "scan_report_blob": scan_report.name,
                "data_dictionary_blob": "None",
            }

            blob_client = blob_service_client.get_blob_client(
                container="scan-reports", blob=scan_report.name
            )
            blob_client.upload_blob(
                form.cleaned_data.get("scan_report_file").open(),
                content_settings=ContentSettings(
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ),
            )
            # setting content settings for downloading later
        # Else upload the scan report and the data dictionary
        else:
            data_dictionary = DataDictionary.objects.create(
                name=f"{os.path.splitext(str(form.cleaned_data.get('data_dictionary_file')))[0]}"
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

            blob_client = blob_service_client.get_blob_client(
                container="scan-reports", blob=scan_report.name
            )
            blob_client.upload_blob(form.cleaned_data.get("scan_report_file").open())
            blob_client = blob_service_client.get_blob_client(
                container="data-dictionaries", blob=data_dictionary.name
            )
            blob_client.upload_blob(
                form.cleaned_data.get("data_dictionary_file").open()
            )

        print("Azure Dictionary >>> ", azure_dict)

        queue_message = json.dumps(azure_dict)
        message_bytes = queue_message.encode("ascii")
        base64_bytes = base64.b64encode(message_bytes)
        base64_message = base64_bytes.decode("ascii")

        print("VIEWS.PY QUEUE MESSAGE >>> ", queue_message)

        # Check if this env should be using Upload Only, and send it the right queue.
        upload_only = os.environ.get("UPLOAD_ONLY").lower() == "true"
        if upload_only:
            queue_name = os.environ.get("UPLOAD_QUEUE_NAME")
        else:
            queue_name = os.environ.get("SCAN_REPORT_QUEUE_NAME")

        queue = QueueClient.from_connection_string(
            conn_str=os.environ.get("STORAGE_CONN_STRING"),
            queue_name=queue_name,
        )
        queue.send_message(base64_message)

        return super().form_valid(form)


@method_decorator(login_required, name="dispatch")
class ScanReportAssertionView(ListView):
    model = ScanReportAssertion

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        x = ScanReport.objects.get(pk=self.kwargs.get("pk"))
        context.update({"scan_report": x})
        return context

    def get_queryset(self):
        qs = super().get_queryset()

        qs = qs.filter(scan_report=self.kwargs["pk"])
        return qs


@method_decorator(login_required, name="dispatch")
class ScanReportAssertionFormView(FormView):
    model = ScanReportAssertion
    form_class = ScanReportAssertionForm
    template_name = "mapping/scanreportassertion_form.html"

    def form_valid(self, form):
        scan_report = ScanReport.objects.get(pk=self.kwargs.get("pk"))

        assertion = ScanReportAssertion.objects.create(
            negative_assertion=form.cleaned_data["negative_assertion"],
            scan_report=scan_report,
        )
        assertion.save()

        return super().form_valid(form)

    def get_success_url(self, **kwargs):
        return reverse("scan-report-assertion", kwargs={"pk": self.kwargs["pk"]})


@method_decorator(login_required, name="dispatch")
class ScanReportAssertionsUpdateView(UpdateView):
    model = ScanReportAssertion
    fields = [
        "negative_assertion",
    ]

    def get_success_url(self, **kwargs):
        return reverse(
            "scan-report-assertion", kwargs={"pk": self.object.scan_report.id}
        )


@method_decorator(login_required, name="dispatch")
class CCPasswordChangeView(FormView):
    form_class = PasswordChangeForm
    success_url = reverse_lazy("password_change_done")
    template_name = "registration/password_change_form.html"

    @method_decorator(sensitive_post_parameters())
    @method_decorator(csrf_protect)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs["user"] = self.request.user
        return kwargs

    def form_valid(self, form):
        form.save()
        return super().form_valid(form)


@method_decorator(login_required, name="dispatch")
class CCPasswordChangeDoneView(PasswordChangeDoneView):
    template_name = "registration/password_change_done.html"

    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)


def password_reset_request(request):
    if request.method == "POST":
        password_reset_form = PasswordResetForm(request.POST)
        if password_reset_form.is_valid():
            data = password_reset_form.cleaned_data["email"]
            associated_users = User.objects.filter(Q(email=data))
            if associated_users.exists():
                for user in associated_users:
                    subject = "Password Reset Requested"
                    email_template_name = "/registration/password_reset_email.txt"
                    c = {
                        "email": user.email,
                        "domain": "0.0.0.0:8000",
                        "site_name": "Website",
                        "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                        "user": user,
                        "token": default_token_generator.make_token(user),
                        "protocol": "http",
                    }
                    email = render_to_string(email_template_name, c)
                    try:
                        send_mail(
                            subject,
                            email,
                            "admin@example.com",
                            [user.email],
                            fail_silently=False,
                        )
                    except BadHeaderError:
                        return HttpResponse("Invalid header found.")
                    return redirect("/password_reset_done/")
    password_reset_form = PasswordResetForm()
    return render(
        request=request,
        template_name="/registration/password_reset.html",
        context={"password_reset_form": password_reset_form},
    )


def load_omop_fields(request):
    omop_table_id = request.GET.get("omop_table")
    omop_fields = OmopField.objects.filter(table_id=omop_table_id).order_by("field")
    return render(
        request,
        "mapping/omop_table_dropdown_list_options.html",
        {"omop_fields": omop_fields},
    )


# To be removed
# Run NLP at the field level
def run_nlp_field_level(request):
    search_term = request.GET.get("search", None)
    field = ScanReportField.objects.get(pk=search_term)
    start_nlp_field_level(request, search_term=search_term)

    return redirect("/fields/?search={}".format(field.scan_report_table.id))


# To be removed
# Run NLP for all fields/values within a table
def run_nlp_table_level(request):
    search_term = request.GET.get("search", None)
    table = ScanReportTable.objects.get(pk=search_term)
    fields = ScanReportField.objects.filter(scan_report_table=search_term)

    for item in fields:
        start_nlp_field_level(search_term=item.id)

    return redirect("/tables/?search={}".format(table.id))


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


@login_required
def dataset_list_page(request):
    return render(request, "mapping/dataset_list.html")


@login_required
def dataset_admin_page(request, pk):
    args = {}
    try:
        ds = Dataset.objects.get(id=pk)
        args["is_admin"] = ds.admins.filter(id=request.user.id).exists()

        if (
            has_viewership(ds, request)
            or has_editorship(ds, request)
            or is_admin(ds, request)
        ):
            return render(request, "mapping/admin_dataset_form.html", args)
        else:
            return render(request, "mapping/error_404.html")
    except ObjectDoesNotExist:
        return render(request, "mapping/error_404.html")


@login_required
def dataset_content_page(request, pk):
    args = {}
    try:
        ds = Dataset.objects.get(id=pk)
        args["is_admin"] = ds.admins.filter(id=request.user.id).exists()

        if (
            has_viewership(ds, request)
            or has_editorship(ds, request)
            or is_admin(ds, request)
        ):
            return render(request, "mapping/datasets_content.html", args)
        else:
            return render(request, "mapping/error_404.html")
    except ObjectDoesNotExist:
        return render(request, "mapping/error_404.html")


@login_required
def scanreport_admin_page(request, pk):
    args = {}
    try:
        sr = ScanReport.objects.get(id=pk)
        _is_admin = (
            sr.author.id == request.user.id
            or sr.parent_dataset.admins.filter(id=request.user.id).exists()
        )
        args["is_admin"] = _is_admin

        if (
            has_viewership(sr, request)
            or has_editorship(sr, request)
            or is_admin(sr, request)
        ):
            return render(request, "mapping/admin_scanreport_form.html", args)
        else:
            return render(request, "mapping/error_404.html")
    except ObjectDoesNotExist:
        return render(request, "mapping/error_404.html")


@login_required
def scanreport_table_list_page(request, pk):
    args = {}

    try:
        scan_report = ScanReport.objects.get(id=pk)

        args["can_edit"] = has_editorship(scan_report, request) or is_admin(
            scan_report, request
        )

        if (
            has_viewership(scan_report, request)
            or has_editorship(scan_report, request)
            or is_admin(scan_report, request)
        ):
            return render(request, "mapping/scanreporttable_list.html", args)
        else:
            return render(request, "mapping/error_404.html")
    except ObjectDoesNotExist:
        return render(request, "mapping/error_404.html")


@login_required
def scanreport_fields_list_page(request, sr, pk):
    args = {}
    try:
        scan_report_table = ScanReportTable.objects.select_related("scan_report").get(
            id=pk, scan_report__id=sr
        )

        args["pk"] = pk
        args["can_edit"] = has_editorship(scan_report_table, request) or is_admin(
            scan_report_table, request
        )
        if (
            has_viewership(scan_report_table, request)
            or has_editorship(scan_report_table, request)
            or is_admin(scan_report_table, request)
        ):
            return render(request, "mapping/scanreportfield_list.html", args)
        else:
            return render(request, "mapping/error_404.html")
    except ObjectDoesNotExist:
        return render(request, "mapping/error_404.html")


@login_required
def scanreport_values_list_page(request, sr, tbl, pk):
    args = {}

    try:
        scan_report_field = ScanReportField.objects.select_related(
            "scan_report_table", "scan_report_table__scan_report"
        ).get(id=pk, scan_report_table=tbl, scan_report_table__scan_report=sr)

        args["pk"] = pk
        args["can_edit"] = has_editorship(scan_report_field, request) or is_admin(
            scan_report_field, request
        )

        if (
            has_viewership(scan_report_field, request)
            or has_editorship(scan_report_field, request)
            or is_admin(scan_report_field, request)
        ):
            return render(request, "mapping/scanreportvalue_list.html", args)
        else:
            return render(request, "mapping/error_404.html")
    except ObjectDoesNotExist:
        return render(request, "mapping/error_404.html")


@login_required
def update_scanreport_field_page(request, sr, tbl, pk):
    args = {"pk": pk}
    try:
        scan_report_field = ScanReportField.objects.select_related(
            "scan_report_table", "scan_report_table__scan_report"
        ).get(id=pk, scan_report_table=tbl, scan_report_table__scan_report=sr)

        args["can_edit"] = has_editorship(scan_report_field, request) or is_admin(
            scan_report_field, request
        )

        if (
            has_viewership(scan_report_field, request)
            or has_editorship(scan_report_field, request)
            or is_admin(scan_report_field, request)
        ):
            return render(request, "mapping/scanreportfield_form.html", args)
        else:
            return render(request, "mapping/error_404.html")
    except ObjectDoesNotExist:
        return render(request, "mapping/error_404.html")
