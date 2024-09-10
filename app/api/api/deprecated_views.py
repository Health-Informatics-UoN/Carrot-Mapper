import logging
import os
from typing import Any
from urllib.parse import urljoin

import requests
from api.filters import ScanReportAccessFilter
from api.paginations import CustomPagination
from api.serializers import (
    GetRulesAnalysis,
    ScanReportConceptSerializer,
    ScanReportEditSerializer,
    ScanReportFieldEditSerializer,
    ScanReportTableEditSerializer,
    UserSerializer,
)
from config import settings
from datasets.serializers import DataPartnerSerializer
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.db.models.query_utils import Q
from django.http import HttpResponse, JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from shared.data.models import Concept
from shared.mapping.models import (
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
from shared.mapping.permissions import (
    CanAdmin,
    CanEdit,
    CanView,
    get_user_permissions_on_dataset,
)
from shared.services.rules import delete_mapping_rules
from shared.services.rules_export import (
    get_mapping_rules_json,
    get_mapping_rules_list,
    make_dag,
)

from .deprecated_serializers import (
    ConceptSerializer,
    ContentTypeSerializer,
    DatasetAndDataPartnerViewSerializer,
    DatasetEditSerializer,
    DatasetViewSerializerV2,
    OmopFieldSerializer,
    OmopTableSerializer,
    ScanReportFieldListSerializer,
    ScanReportTableListSerializer,
    ScanReportValueEditSerializer,
    ScanReportValueViewSerializer,
    ScanReportViewSerializer,
)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class UserFilterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {"id": ["in", "exact"], "is_active": ["exact"]}


class DataPartnerViewSet(viewsets.ModelViewSet):
    queryset = DataPartner.objects.all()
    serializer_class = DataPartnerSerializer


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


class MappingRulesList(APIView):
    def post(self, request, *args, **kwargs):
        try:
            body = request.data
        except ValueError:
            body = {}
        if request.POST.get("get_svg") is not None or body.get("get_svg") is not None:
            qs = self.get_queryset()
            output = get_mapping_rules_json(qs)

            # use make dag svg image
            svg = make_dag(output["cdm"])
            return HttpResponse(svg, content_type="image/svg+xml")
        else:
            return Response(
                {"error": "Invalid request parameters"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def get_queryset(self):
        qs = MappingRule.objects.all()
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
        p = self.request.query_params.get("p", 1)
        page_size = self.request.query_params.get("page_size", 30)
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


class SummaryRulesList(RulesList):
    def list(self, request):
        # Get p and page_size from query_params
        p = self.request.query_params.get("p", 1)
        page_size = self.request.query_params.get("page_size", 20)
        # Get queryset
        queryset = self.get_queryset()

        # Directly filter OmopField objects that end with "_concept_id" but not "_source_concept_id"
        omop_fields_queryset = OmopField.objects.filter(
            pk__in=queryset.values_list("omop_field_id", flat=True),
            field__endswith="_concept_id",
        ).exclude(field__endswith="_source_concept_id")

        ids_list = omop_fields_queryset.values_list("id", flat=True)
        # Filter the queryset based on valid omop_field_ids
        filtered_queryset = queryset.filter(omop_field_id__in=ids_list)
        count = filtered_queryset.count()
        # Get the rules list based on the filtered queryset
        rules = get_mapping_rules_list(
            filtered_queryset, page_number=int(p), page_size=int(page_size)
        )
        # Process rules
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


class OmopTableViewSet(viewsets.ModelViewSet):
    queryset = OmopTable.objects.all()
    serializer_class = OmopTableSerializer


class OmopFieldViewSet(viewsets.ModelViewSet):
    queryset = OmopField.objects.all()
    serializer_class = OmopFieldSerializer


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


class DatasetListView(generics.ListAPIView):
    """
    API view to show all datasets.
    """

    serializer_class = DatasetViewSerializerV2
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
    serializer_class = DatasetViewSerializerV2
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

    serializer_class = DatasetViewSerializerV2
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


class DatasetPermissionView(APIView):
    """
    API for permissions a user has on a specific dataset.
    """

    def get(self, request, pk):
        permissions = get_user_permissions_on_dataset(request, pk)

        return Response({"permissions": permissions}, status=status.HTTP_200_OK)
