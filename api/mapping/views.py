import json
import os
import base64
import random
import string
import datetime

from azure.storage.queue import QueueClient
from azure.storage.blob import BlobServiceClient, ContentSettings

from rest_framework import status, viewsets, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
)
from rest_framework.renderers import JSONRenderer

from .serializers import (
    ScanReportSerializer,
    ScanReportTableSerializer,
    ScanReportFieldSerializer,
    ScanReportValueSerializer,
    ScanReportConceptSerializer,
    ClassificationSystemSerializer,
    DataDictionarySerializer,
    DataPartnerSerializer,
    OmopTableSerializer,
    OmopFieldSerializer,
    MappingRuleSerializer,
    GetRulesJSON,
    GetRulesList,
    UserSerializer,
    DatasetSerializer,
    ProjectSerializer,
    ProjectNameSerializer,
)
from .serializers import (
    ConceptSerializer,
    VocabularySerializer,
    ConceptRelationshipSerializer,
    ConceptAncestorSerializer,
    ConceptClassSerializer,
    ConceptSynonymSerializer,
    DomainSerializer,
    DrugStrengthSerializer,
)
from django_filters.rest_framework import DjangoFilterBackend
from data.models import (
    Concept,
    Vocabulary,
    ConceptRelationship,
    ConceptAncestor,
    ConceptClass,
    ConceptSynonym,
    Domain,
    DrugStrength,
)

from data.models import Concept
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm, PasswordResetForm
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.views import PasswordChangeDoneView
from django.core.mail import BadHeaderError, send_mail
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import CharField
from django.db.models import Value as V
from django.db.models.functions import Concat
from django.db.models.query_utils import Q
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.template.loader import render_to_string
from django.urls import reverse, reverse_lazy
from django.utils.decorators import method_decorator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.views import generic
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from django.views.generic import ListView
from django.views.generic.edit import FormView, UpdateView

from .forms import (
    ScanReportAssertionForm,
    ScanReportFieldConceptForm,
    ScanReportForm,
    UserCreateForm,
    ScanReportValueConceptForm,
    ScanReportFieldForm,
)
from .models import (
    DataDictionary,
    DataPartner,
    OmopTable,
    OmopField,
    OmopTable,
    Project,
    ScanReport,
    ScanReportAssertion,
    ScanReportField,
    ScanReportTable,
    ScanReportValue,
    MappingRule,
    ScanReportConcept,
    ClassificationSystem,
    Dataset,
)
from .permissions import CanViewProject
from .services import download_data_dictionary_blob

from .services_nlp import start_nlp_field_level

from .services_rules import (
    save_mapping_rules,
    remove_mapping_rules,
    find_existing_scan_report_concepts,
    download_mapping_rules,
    download_mapping_rules_as_csv,
    get_mapping_rules_list,
    view_mapping_rules,
    find_date_event,
    find_person_id,
    find_destination_table,
    find_standard_concept,
    m_allowed_tables,
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
    filterset_fields = ["concept_id_1", "concept_id_2", "relationship_id"]


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


class ProjectListView(ListAPIView):
    """
    API view to show all projects' names.
    """

    permission_classes = []
    serializer_class = ProjectNameSerializer
    queryset = Project.objects.all()


class ProjectRetrieveView(RetrieveAPIView):
    """
    API view to retrieve a single project.
    Will return 403 Forbidden if User isn't a member.
    """

    permission_classes = [CanViewProject]
    serializer_class = ProjectSerializer
    queryset = Project.objects.all()


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class UserFilterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {"id": ["in", "exact"]}


class ScanReportViewSet(viewsets.ModelViewSet):
    queryset = ScanReport.objects.all()
    serializer_class = ScanReportSerializer

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

    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer
    # permission_classes = []


class DatasetRetrieveView(generics.RetrieveAPIView):
    """
    This view should return a single dataset from an id
    """

    serializer_class = DatasetSerializer
    # permission_classes = []
    def get_queryset(self):
        qs = Dataset.objects.filter(id=self.kwargs["pk"])
        return qs


class ScanReportTableViewSet(viewsets.ModelViewSet):
    queryset = ScanReportTable.objects.all()
    serializer_class = ScanReportTableSerializer

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


class ScanReportTableFilterViewSet(viewsets.ModelViewSet):
    queryset = ScanReportTable.objects.all()
    serializer_class = ScanReportTableSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "scan_report": ["in", "exact"],
        "name": ["in", "exact"],
        "id": ["in", "exact"],
    }


class ScanReportFieldViewSet(viewsets.ModelViewSet):
    queryset = ScanReportField.objects.all()
    serializer_class = ScanReportFieldSerializer

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


class ScanReportFieldFilterViewSet(viewsets.ModelViewSet):
    queryset = ScanReportField.objects.all()
    serializer_class = ScanReportFieldSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "scan_report_table": ["in", "exact"],
        "name": ["in", "exact"],
        "id": ["in", "exact"],
    }


class ScanReportConceptViewSet(viewsets.ModelViewSet):
    queryset = ScanReportConcept.objects.all()
    serializer_class = ScanReportConceptSerializer

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


class ScanReportConceptFilterViewSet(viewsets.ModelViewSet):
    queryset = ScanReportConcept.objects.all()
    serializer_class = ScanReportConceptSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "concept__concept_id": ["in", "exact"],
        "object_id": ["in", "exact"],
        "id": ["in", "exact"],
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
    queryset = ScanReport.objects.all()
    serializer_class = GetRulesList
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["id"]


class MappingRuleFilterViewSet(viewsets.ModelViewSet):
    queryset = MappingRule.objects.all()
    serializer_class = MappingRuleSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["scan_report"]


class ScanReportValueViewSet(viewsets.ModelViewSet):
    queryset = ScanReportValue.objects.all()
    serializer_class = ScanReportValueSerializer

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


class ScanReportValueFilterViewSet(viewsets.ModelViewSet):
    queryset = ScanReportValue.objects.all()
    serializer_class = ScanReportValueSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "scan_report_field": ["in", "exact"],
        "value": ["in", "exact"],
        "id": ["in", "exact"],
    }


class ScanReportValuesFilterViewSetScanReport(viewsets.ModelViewSet):
    serializer_class = ScanReportValueSerializer
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
    serializer_class = ScanReportValueSerializer
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
            scanreporttable_count = ScanReportTable.objects.filter(
                scan_report=scanreport
            ).count()
            scanreportfield_count = ScanReportField.objects.filter(
                scan_report_table__scan_report=scanreport
            ).count()
            scanreportvalue_count = ScanReportValue.objects.filter(
                scan_report_field__scan_report_table__scan_report=scanreport
            ).count()
            scanreportmappingrule_count = MappingRule.objects.filter(
                scan_report=scanreport
            ).count()

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
    serializer_class = ScanReportValueSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["scan_report_field__scan_report_table__scan_report"]

    def get_queryset(self):
        qs = ScanReportValue.objects.filter(
            scan_report_field__scan_report_table__scan_report=self.request.GET[
                "scan_report"
            ]
        ).exclude(conceptID=-1)
        return qs


@login_required
def home(request):
    return render(request, "mapping/home.html", {})


@method_decorator(login_required, name="dispatch")
class ScanReportTableListView(ListView):
    model = ScanReportTable

    def post(self, request, *args, **kwargs):
        if request.POST.get("download-dd") is not None:
            qs = self.get_queryset()
            scan_report = self.get_queryset()[0].scan_report
            return download_data_dictionary_blob(
                scan_report.data_dictionary.name, container="data-dictionaries"
            )

    def get_queryset(self):
        qs = super().get_queryset()
        search_term = self.request.GET.get("search", None)
        if search_term is not None and search_term != "":
            qs = qs.filter(scan_report__id=search_term).order_by("name")

        return qs

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)
        if len(self.get_queryset()) > 0:
            scan_report = self.get_queryset()[0].scan_report
            scan_report_name = scan_report.name
            scan_report_table = self.get_queryset()[0]
            try:
                data_dictionary = scan_report.data_dictionary
            except:
                data_dictionary = None
        else:
            scan_report = None
            scan_report_name = None
            scan_report_table = None
            data_dictionary = None

        context.update(
            {
                "scan_report": scan_report,
                "scan_report_name": scan_report_name,
                "scan_report_table": scan_report_table,
                "data_dictionary": data_dictionary,
            }
        )

        return context


@method_decorator(login_required, name="dispatch")
class ScanReportTableUpdateView(UpdateView):
    model = ScanReportTable
    fields = ["person_id", "date_event"]

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # filter so the objects can only be associated to the current scanreport table
        scan_report_table = context["scanreporttable"]
        qs = ScanReportField.objects.filter(
            scan_report_table=scan_report_table
        ).order_by("name")

        for key in context["form"].fields.keys():
            context["form"].fields[key].queryset = qs

            def label_from_instance(obj):
                return obj.name

            context["form"].fields[key].label_from_instance = label_from_instance
        return context

    def get_success_url(self):
        return "{}?search={}".format(reverse("tables"), self.object.scan_report.id)


@method_decorator(login_required, name="dispatch")
class ScanReportFieldListView(ListView):
    model = ScanReportField
    fields = ["concept_id"]
    template_name = "mapping/scanreportfield_list.html"
    factory_kwargs = {"can_delete": False, "extra": False}

    def get_queryset(self):
        qs = super().get_queryset().order_by("id")
        search_term = self.request.GET.get("search", None)
        if search_term is not None:
            qs = qs.filter(scan_report_table__id=search_term)
        return qs

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)

        if len(self.get_queryset()) > 0:
            scan_report = self.get_queryset()[0].scan_report_table.scan_report
            scan_report_table = self.get_queryset()[0].scan_report_table
            scan_report_field = self.get_queryset()[0]
        else:
            scan_report = None
            scan_report_table = None
            scan_report_field = None

        context.update(
            {
                "scan_report": scan_report,
                "scan_report_table": scan_report_table,
                "scan_report_field": scan_report_field,
            }
        )

        return context


@method_decorator(login_required, name="dispatch")
class ScanReportFieldUpdateView(UpdateView):
    model = ScanReportField
    form_class = ScanReportFieldForm
    template_name = "mapping/scanreportfield_form.html"

    def get_success_url(self):
        return "{}?search={}".format(
            reverse("fields"), self.object.scan_report_table.id
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


@method_decorator(login_required, name="dispatch")
class ScanReportStructuralMappingUpdateView(UpdateView):
    model = ScanReportField
    fields = ["mapping"]

    def get_success_url(self):
        return "{}?search={}".format(
            reverse("fields"), self.object.scan_report_table.id
        )


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
class ScanReportValueListView(ListView):
    model = ScanReportValue
    template_name = "mapping/scanreportvalue_list.html"
    fields = ["conceptID"]
    factory_kwargs = {"can_delete": False, "extra": False}

    def get_queryset(self):
        search_term = self.request.GET.get("search", None)

        if search_term is not None:
            # qs = ScanReportValue.objects.select_related('concepts').filter(scan_report_field=search_term)
            qs = ScanReportValue.objects.filter(scan_report_field=search_term).order_by(
                "value"
            )
        else:
            qs = ScanReportValue.objects.all()

        return qs

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)

        if len(self.get_queryset()) > 0:
            # scan_report = self.get_queryset()[0].scan_report_table.scan_report
            # scan_report_table = self.get_queryset()[0].scan_report_table
            scan_report = self.get_queryset()[
                0
            ].scan_report_field.scan_report_table.scan_report
            scan_report_table = self.get_queryset()[
                0
            ].scan_report_field.scan_report_table
            scan_report_field = self.get_queryset()[0].scan_report_field
            scan_report_value = self.get_queryset()[0]
        else:
            scan_report = None
            scan_report_table = None
            scan_report_field = None
            scan_report_value = None

        context.update(
            {
                "scan_report": scan_report,
                "scan_report_table": scan_report_table,
                "scan_report_field": scan_report_field,
                "scan_report_value": scan_report_value,
            }
        )

        return context


@method_decorator(login_required, name="dispatch")
class StructuralMappingTableListView(ListView):
    model = MappingRule
    template_name = "mapping/mappingrulesscanreport_list.html"

    def post(self, request, *args, **kwargs):
        if request.POST.get("download_rules") is not None:
            qs = self.get_queryset()
            return download_mapping_rules(request, qs)
        elif request.POST.get("download_rules_as_csv") is not None:
            qs = self.get_queryset()
            return download_mapping_rules_as_csv(request, qs)
        elif request.POST.get("refresh_rules") is not None:
            # remove all existing rules first
            remove_mapping_rules(request, self.kwargs.get("pk"))
            # get all associated ScanReportConcepts for this given ScanReport
            ## this method could be taking too long to execute
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

        elif request.POST.get("get_svg") is not None:
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

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)
        pk = self.kwargs.get("pk")

        scan_report = ScanReport.objects.get(pk=pk)

        object_list = get_mapping_rules_list(self.get_queryset())
        source_tables = list(set([x["source_table"].name for x in object_list]))

        filtered_omop_table = self.kwargs.get("omop_table")
        current_source_table = self.kwargs.get("source_table")

        context.update(
            {
                "object_list": object_list,
                "scan_report": scan_report,
                "omop_tables": m_allowed_tables,
                "source_tables": source_tables,
                "filtered_omop_table": filtered_omop_table,
                "current_source_table": current_source_table,
            }
        )
        return context


@method_decorator(login_required, name="dispatch")
class ScanReportFormView(FormView):
    form_class = ScanReportForm
    template_name = "mapping/upload_scan_report.html"
    success_url = reverse_lazy("scan-report-list")

    def form_valid(self, form):

        # Create random alphanumeric to link scan report to data dictionary
        # Create datetime stamp for scan report and data dictionary upload time
        rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
        dt = "{:%Y%m%d-%H%M%S_}".format(datetime.datetime.now())
        print(dt, rand)
        # Create an entry in ScanReport for the uploaded Scan Report
        scan_report = ScanReport.objects.create(
            data_partner=form.cleaned_data["data_partner"],
            dataset=form.cleaned_data["dataset"],
            parent_dataset=form.cleaned_data["parent_dataset"],
            name=os.path.splitext(str(form.cleaned_data.get("scan_report_file")))[0]
            + "_"
            + dt
            + rand
            + ".xlsx",
        )

        scan_report.author = self.request.user
        scan_report.save()

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
                name=os.path.splitext(
                    str(form.cleaned_data.get("data_dictionary_file"))
                )[0]
                + "_"
                + dt
                + rand
                + ".csv",
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

        queue = QueueClient.from_connection_string(
            conn_str=os.environ.get("STORAGE_CONN_STRING"),
            queue_name=os.environ.get("SCAN_REPORT_QUEUE_NAME"),
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
class DataDictionaryListView(ListView):
    model = DataDictionary
    ordering = ["-source_value"]

    def get_queryset(self):
        qs = super().get_queryset()

        # Create a concat field for NLP to work from
        # V is imported from models, used to comma separate other fields
        qs = qs.annotate(
            nlp_string=Concat(
                "source_value__scan_report_field__name",
                V(", "),
                "source_value__value",
                V(", "),
                "dictionary_field_description",
                V(", "),
                "dictionary_value_description",
                output_field=CharField(),
            )
        )

        search_term = self.request.GET.get("search", None)
        if search_term is not None:

            assertions = ScanReportAssertion.objects.filter(scan_report__id=search_term)
            neg_assertions = assertions.values_list("negative_assertion")

            # Grabs ScanReportFields where pass_from_source=True, makes list distinct
            qs_1 = (
                qs.filter(
                    source_value__scan_report_field__scan_report_table__scan_report__id=search_term
                )
                .filter(source_value__scan_report_field__pass_from_source=True)
                .filter(source_value__scan_report_field__is_patient_id=False)
                .filter(source_value__scan_report_field__is_date_event=False)
                .filter(source_value__scan_report_field__is_ignore=False)
                .exclude(source_value__value="List truncated...")
                .distinct("source_value__scan_report_field")
                .order_by("source_value__scan_report_field")
            )

            # Grabs everything but removes all where pass_from_source=False
            # Filters out negative assertions and 'List truncated...'
            qs_2 = (
                qs.filter(
                    source_value__scan_report_field__scan_report_table__scan_report__id=search_term
                )
                .filter(source_value__scan_report_field__pass_from_source=False)
                .filter(source_value__scan_report_field__is_patient_id=False)
                .filter(source_value__scan_report_field__is_date_event=False)
                .filter(source_value__scan_report_field__is_ignore=False)
                .exclude(source_value__value="List truncated...")
                .exclude(source_value__value__in=neg_assertions)
            )

            # Stick qs_1 and qs_2 together
            qs_total = qs_1.union(qs_2)

            # Create object to convert to JSON
            for_json = qs_total.values(
                "id",
                "source_value__value",
                "source_value__scan_report_field__name",
                "nlp_string",
            )

            serialized_q = json.dumps(list(for_json), cls=DjangoJSONEncoder, indent=6)

            # with open("/data/data.json", "w") as json_file:
            #    json.dump(list(for_json), json_file, cls=DjangoJSONEncoder, indent=6)

        return qs_total

    def get_context_data(self, **kwargs):

        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)

        if len(self.get_queryset()) > 0:
            scan_report = self.get_queryset()[
                0
            ].source_value.scan_report_field.scan_report_table.scan_report
        else:
            scan_report = None

        context.update({"scan_report": scan_report})

        return context


@method_decorator(login_required, name="dispatch")
class DataDictionaryUpdateView(UpdateView):
    model = DataDictionary
    fields = [
        "dictionary_table",
        "dictionary_field",
        "dictionary_field_description",
        "dictionary_value",
        "dictionary_value_description",
        "definition_fixed",
    ]

    def get_success_url(self):
        return "{}?search={}".format(
            reverse("data-dictionary"),
            self.object.source_value.scan_report_field.scan_report_table.scan_report.id,
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


# Run NLP at the field level
def run_nlp_field_level(request):

    search_term = request.GET.get("search", None)
    field = ScanReportField.objects.get(pk=search_term)
    start_nlp_field_level(request, search_term=search_term)

    return redirect("/fields/?search={}".format(field.scan_report_table.id))


# Run NLP for all fields/values within a table
def run_nlp_table_level(request):

    search_term = request.GET.get("search", None)
    table = ScanReportTable.objects.get(pk=search_term)
    fields = ScanReportField.objects.filter(scan_report_table=search_term)

    for item in fields:
        start_nlp_field_level(search_term=item.id)

    return redirect("/tables/?search={}".format(table.id))


def validate_concept(request, source_concept):
    if find_destination_table(request, source_concept) == None:
        return False

    if not validate_standard_concept(request, source_concept):
        return False

    return True


def validate_standard_concept(request, source_concept):

    # if it's a standard concept -- pass
    if source_concept.standard_concept == "S":
        messages.success(
            request,
            "Concept {} - {} added successfully.".format(
                source_concept.concept_id, source_concept.concept_name
            ),
        )
        return True
    else:
        # otherwse
        # return an error if it's Non-Standard
        # dont allow the ScanReportConcept to be created
        messages.error(
            request,
            "Concept {} ({}) is Non-Standard".format(
                source_concept.concept_id, source_concept.concept_name
            ),
        )
        concept = find_standard_concept(source_concept)
        if concept == None:
            messages.error(
                request, "No associated Standard Concept could be found for this!"
            )
        else:
            messages.error(
                request,
                "You could try {} ({}) ?".format(
                    concept.concept_id, concept.concept_name
                ),
            )

        return False


def pass_content_object_validation(request, scan_report_table):
    if find_person_id(scan_report_table) == None:
        messages.error(
            request,
            f"you have not set a person_id on this table {scan_report_table.name}."
            "Please go set this at the table level before trying to add a concept",
        )
        return False
    if find_date_event(scan_report_table) == None:
        messages.error(
            request,
            f"you have not set a date_event on this table {scan_report_table.name}."
            "Please go set this at the table level before trying to add a concept",
        )
        return False

    return True


def save_scan_report_value_concept(request):
    if request.method == "POST":
        form = ScanReportValueConceptForm(request.POST)
        if form.is_valid():

            scan_report_value = ScanReportValue.objects.get(
                pk=form.cleaned_data["scan_report_value_id"]
            )

            if not pass_content_object_validation(
                request, scan_report_value.scan_report_field.scan_report_table
            ):
                return redirect(
                    "/values/?search={}".format(scan_report_value.scan_report_field.id)
                )

            try:
                concept = Concept.objects.get(
                    concept_id=form.cleaned_data["concept_id"]
                )
            except Concept.DoesNotExist:
                messages.error(
                    request,
                    "Concept id {} does not exist in our database.".format(
                        form.cleaned_data["concept_id"]
                    ),
                )
                return redirect(
                    "/values/?search={}".format(scan_report_value.scan_report_field.id)
                )

            # perform a standard check on the concept
            pass_concept_check = validate_concept(request, concept)
            if pass_concept_check:
                scan_report_concept = ScanReportConcept.objects.create(
                    concept=concept,
                    content_object=scan_report_value,
                )

                save_mapping_rules(request, scan_report_concept)

            return redirect(
                "/values/?search={}".format(scan_report_value.scan_report_field.id)
            )


def delete_scan_report_value_concept(request):
    scan_report_field_id = request.GET.get("scan_report_field_id")
    scan_report_concept_id = request.GET.get("scan_report_concept_id")

    scan_report_concept = ScanReportConcept.objects.get(pk=scan_report_concept_id)

    # scan_report_concept.mappingrule.delete()

    concept_id = scan_report_concept.concept.concept_id
    concept_name = scan_report_concept.concept.concept_name

    scan_report_concept.delete()

    messages.success(
        request,
        "Concept {} - {} removed successfully.".format(concept_id, concept_name),
    )

    return redirect("/values/?search={}".format(scan_report_field_id))


def save_scan_report_field_concept(request):
    if request.method == "POST":
        form = ScanReportFieldConceptForm(request.POST)
        if form.is_valid():

            scan_report_field = ScanReportField.objects.get(
                pk=form.cleaned_data["scan_report_field_id"]
            )

            if not pass_content_object_validation(
                request, scan_report_field.scan_report_table
            ):
                return redirect(
                    "/fields/?search={}".format(scan_report_field.scan_report_table.id)
                )

            try:
                concept = Concept.objects.get(
                    concept_id=form.cleaned_data["concept_id"]
                )
            except Concept.DoesNotExist:
                messages.error(
                    request,
                    "Concept id {} does not exist in our database.".format(
                        form.cleaned_data["concept_id"]
                    ),
                )
                return redirect(
                    "/fields/?search={}".format(scan_report_field.scan_report_table.id)
                )

            # perform a standard check on the concept
            pass_concept_check = validate_concept(request, concept)
            if pass_concept_check:
                scan_report_concept = ScanReportConcept.objects.create(
                    concept=concept,
                    content_object=scan_report_field,
                )

                save_mapping_rules(request, scan_report_concept)

            return redirect(
                "/fields/?search={}".format(scan_report_field.scan_report_table.id)
            )


def delete_scan_report_field_concept(request):

    scan_report_table_id = request.GET.get("scan_report_table_id")
    scan_report_concept_id = request.GET.get("scan_report_concept_id")

    scan_report_concept = ScanReportConcept.objects.get(pk=scan_report_concept_id)

    concept_id = scan_report_concept.concept.concept_id
    concept_name = scan_report_concept.concept.concept_name

    scan_report_concept.delete()

    messages.success(
        request,
        "Concept {} - {} removed successfully.".format(concept_id, concept_name),
    )

    return redirect("/fields/?search={}".format(scan_report_table_id))


class DownloadScanReportViewSet(viewsets.ViewSet):
    def list(self, request, pk):
        scan_report = ScanReport.objects.get(id=pk)
        # scan_report = ScanReportSerializer(scan_reports, many=False).data
        # Set Storage Account connection string
        print(scan_report)
        blob_name = scan_report.name
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
