import ast
import json
import os
import time
from io import StringIO

import pandas as pd
import requests
from data.models import Concept
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm, PasswordResetForm
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.views import PasswordChangeDoneView
from django.contrib.contenttypes.models import ContentType
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
from django.views.generic import DetailView, ListView
from django.views.generic.edit import FormView, UpdateView

from .forms import (
    DictionarySelectForm,
    DocumentFileForm,
    DocumentForm,
    NLPForm,
    ScanReportAssertionForm,
    ScanReportFieldConceptForm,
    ScanReportForm,
    UserCreateForm, ScanReportValueConceptForm,
)
from .models import (
    DataDictionary,
    Document,
    DocumentFile,
    NLPModel,
    OmopField,
    ScanReport,
    ScanReportAssertion,
    ScanReportField,
    ScanReportTable,
    ScanReportValue,
    StructuralMappingRule, ScanReportConcept,
)
from .services_datadictionary import merge_external_dictionary
from .services_nlp import get_json_from_nlpmodel
from .tasks import (
    nlp_single_string_task,
    process_scan_report_task,
)


@login_required
def home(request):
    return render(request, "mapping/home.html", {})


@method_decorator(login_required, name="dispatch")
class ScanReportTableListView(ListView):
    model = ScanReportTable

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
            scan_report_table = self.get_queryset()[0]
        else:
            scan_report = None
            scan_report_table = None

        context.update(
            {
                "scan_report": scan_report,
                "scan_report_table": scan_report_table,
            }
        )

        return context

@method_decorator(login_required, name="dispatch")
class ScanReportTableUpdateView(UpdateView):
    model = ScanReportTable
    fields = [
        "person_id",
        "birth_date",
        "measurement_date",
        "observation_date",
        "condition_date"
    ]

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        #filter so the objects can only be associated to the current scanreport table
        scan_report_table = context['scanreporttable']
        qs = ScanReportField\
            .objects\
            .filter(scan_report_table=scan_report_table)\
            .order_by("name")

        for key in context['form'].fields.keys():
            context['form'].fields[key].queryset = qs

            def label_from_instance(obj):
                return obj.name
            
            context['form'].fields[key].label_from_instance = label_from_instance
        return context
    
    def get_success_url(self):
        return "{}?search={}".format(
            reverse("tables"), self.object.scan_report.id
        )

@method_decorator(login_required, name="dispatch")
class ScanReportFieldListView(ListView):
    model = ScanReportField
    fields = ["concept_id"]
    template_name="mapping/scanreportfield_list.html"
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
    fields = [
        "is_patient_id",
        "is_date_event",
        "date_type",
        "is_ignore",
        "pass_from_source",
        "classification_system",
        "description_column",
    ]

    def get_success_url(self):
        return "{}?search={}".format(
            reverse("fields"), self.object.scan_report_table.id
        )


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
    #order the scanreports now so the latest is first in the table
    ordering = ['-created_at']

    #handle and post methods
    #so far just handle a post when a button to click to hide/show a report
    def post(self, request, *args, **kwargs):
        #obtain the scanreport id from the buttont that is clicked
        _id = request.POST.get("scanreport_id")
        if _id is not None:
            #obtain the scan report based on this id
            report = ScanReport.objects.get(pk=_id)
            #switch hidden True -> False, or False -> True, if clicked
            report.hidden = not report.hidden
            #update the model
            report.save()
        #return to the same page        
        return redirect(request.META['HTTP_REFERER'])


    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)

        #add the current user to the context
        #this is needed so the hide/show buttons can be only turned on
        #by whoever created the report
        context['current_user'] = self.request.user
        
        return context
        
    
    def get_queryset(self):
        search_term = self.request.GET.get("filter", None)
        qs = super().get_queryset()
        if search_term == "archived":
            qs = qs.filter(hidden=True)
        else:
            qs = qs.filter(hidden=False)
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
            qs = ScanReportValue.objects.filter(scan_report_field=search_term).order_by('value')
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
    model = StructuralMappingRule
    template_name = "mapping/mappingrulesscanreport_list.html"

    def get_queryset(self):
        scan_report = ScanReport.objects.get(pk=self.kwargs.get("pk"))

        qs = super().get_queryset()
        search_term = self.kwargs.get("pk")

        if search_term is not None:
            qs = qs.filter(scan_report__id=search_term).order_by(
                "omop_field__table",
                "omop_field__field",
                "source_table__name",
                "source_field__name",
            )

        return qs


@method_decorator(login_required, name="dispatch")
class ScanReportFormView(FormView):
    form_class = ScanReportForm
    template_name = "mapping/upload_scan_report.html"
    success_url = reverse_lazy("scan-report-list")

    def form_valid(self, form):
        # Create an entry in ScanReport for the uploaded Scan Report
        scan_report = ScanReport.objects.create(
            data_partner=form.cleaned_data["data_partner"],
            dataset=form.cleaned_data["dataset"],
            file=form.cleaned_data["scan_report_file"],
        )
        
        scan_report.author = self.request.user
        scan_report.save()
        process_scan_report_task.delay(scan_report.id)

        return super().form_valid(form)


@method_decorator(login_required, name="dispatch")
class ScanReportAssertionView(ListView):
    model = ScanReportAssertion

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        x = ScanReport.objects.get(pk=self.kwargs.get("pk"))
        context.update(
            {
                "scan_report": x,
            }
        )
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
class DocumentFormView(FormView):
    form_class = DocumentForm
    template_name = "mapping/upload_document.html"
    success_url = reverse_lazy("document-list")

    def form_valid(self, form):
        document = Document.objects.create(
            data_partner=form.cleaned_data["data_partner"],
            document_type=form.cleaned_data["document_type"],
            description=form.cleaned_data["description"],
        )
        document.owner = self.request.user

        document.save()
        document_file = DocumentFile.objects.create(
            document_file=form.cleaned_data["document_file"], size=20, document=document
        )
        document_file.save()

        # This code will be required later to import a data dictionary into the DataDictionary model
        # filepath = document_file.document_file.path
        # import_data_dictionary_task.delay(filepath)

        return super().form_valid(form)


@method_decorator(login_required, name="dispatch")
class DocumentListView(ListView):
    model = Document

    def get_queryset(self):
        qs = super().get_queryset().order_by("data_partner")
        return qs


@method_decorator(login_required, name="dispatch")
class DocumentFileListView(ListView):
    model = DocumentFile

    def get_queryset(self):
        qs = super().get_queryset().order_by('-status','-created_at')
        search_term = self.kwargs.get("pk")
        if search_term is not None:
            qs = qs.filter(document__id=search_term)

        return qs
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        x = Document.objects.get(pk=self.kwargs.get("pk"))
        context.update(
            {
                "document": x,
            }
        )
        return context


@method_decorator(login_required, name="dispatch")
class DocumentFileFormView(FormView):
    model = DocumentFile
    form_class = DocumentFileForm
    template_name = "mapping/upload_document_file.html"
    # success_url=reverse_lazy('document-list')

    def form_valid(self, form):
        document=Document.objects.get(pk=self.kwargs.get("pk"))
        document_file = DocumentFile.objects.create(
            document_file=form.cleaned_data["document_file"],
            size=20,
            document=document,
            
        )

        document_file.save()

        return super().form_valid(form)

    def get_success_url(self, **kwargs):
        self.object = self.kwargs.get("pk")
        return reverse("file-list", kwargs={"pk": self.object})
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        x = Document.objects.get(pk=self.kwargs.get("pk"))
        context.update(
            {
                "document": x,
            }
        )
        return context


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

        context.update(
            {
                "scan_report": scan_report,
            }
        )

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
class DictionarySelectFormView(FormView):

    form_class = DictionarySelectForm
    template_name = "mapping/mergedictionary.html"
    success_url = reverse_lazy("data-dictionary")

    def form_valid(self, form):

        # Adapt logic in services.py to merge data dictionary file into DataDictionary model
        return super().form_valid(form)


@method_decorator(login_required, name="dispatch")
class DocumentFileStatusUpdateView(UpdateView):
    model = DocumentFile
    # success_url=reverse_lazy('file-list')
    fields = ["status"]

    def get_success_url(self, **kwargs):
        return reverse("file-list", kwargs={"pk": self.object.document_id})


class SignUpView(generic.CreateView):
    form_class = UserCreateForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"


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


def testusagi(request, scan_report_id):

    results = run_usagi(scan_report_id)
    print(results)
    context = {}

    return render(request, "mapping/index.html", context)


def merge_dictionary(request):

    # Grab the scan report ID
    search_term = request.GET.get("search", None)
    
    # This function is called from services_datadictionary.py
    merge_external_dictionary(request,scan_report_pk=search_term)

    return render(request, "mapping/mergedictionary.html")


@method_decorator(login_required, name="dispatch")
class NLPListView(ListView):
    model = NLPModel


@method_decorator(login_required, name="dispatch")
class NLPFormView(FormView):
    form_class = NLPForm
    template_name = "mapping/nlpmodel_form.html"
    success_url = reverse_lazy("nlp")

    def form_valid(self, form):

        # Create NLP model object on form submission
        # Very simple, just saves the user's string and a 
        # raw str() of the JSON returned from the NLP service
        NLPModel.objects.create(
            user_string=form.cleaned_data["user_string"],
            json_response="holding",
        )

        # Grab the newly-created model object to get the PK
        # Pass PK to Celery task which handles running the NLP code
        pk = NLPModel.objects.latest("id")
        nlp_single_string_task.delay(
            pk=pk.id, dict_string=form.cleaned_data["user_string"]
        )

        return super().form_valid(form)


@method_decorator(login_required, name="dispatch")
class NLPDetailView(DetailView):
    model = NLPModel
    template_name = "mapping/nlpmodel_detail.html"

    def get_context_data(self, **kwargs):
        query = NLPModel.objects.get(pk=self.kwargs.get("pk"))

        # Small check to return something sensible if NLP hasn't finished running
        if query.json_response == "holding":
            context = {"user_string": query.user_string, "results": "Waiting"}
            return context
        
        else:
            # Run method from services_nlp.py
            json_response = get_json_from_nlpmodel(json=ast.literal_eval(query.json_response))
            context = {"user_string": query.user_string, "results": json_response}
            return context

def run_nlp(request):

    # Grab the scan report ID and assertions
    search_term = request.GET.get("search", None)
    assertions = ScanReportAssertion.objects.filter(scan_report__id=search_term)
    neg_assertions = assertions.values_list("negative_assertion")
    
    # Get Data Dictionary Entries for the Scan Report
    # This returns a queryset of *all* entries in the dict model
    dict_entries = DataDictionary.objects.filter(
                source_value__scan_report_field__scan_report_table__scan_report__id=search_term
            )

    # Create an NLP string field from DataDictionary Objects
    qs = dict_entries.annotate(
                nlp_string=Concat(
                    "source_value__value",
                    V(", "),
                    "source_value__scan_report_field__name",
                    output_field=CharField(),
                )
            )
    
    # Logic here for what concatenated fields to send to NLP
    # if dictionary_field_description and dictionary_value_description is Null:
        #concatenate source_field and source_value
    # else if:
        # dictionary_field_description OR dictionary_value_description is Null:
            #concatenate source field or value with whatever is present from the data dictionary
    # else:
        #concatenate dictionary_field_description and dictionary_value_description
    

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
        .annotate(
                src=Concat(
                    V("field"),V(""),
                    output_field=CharField(),
                )
            )
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
        .annotate(
            src=Concat(
                V("value"),V(""),
                output_field=CharField(),
            )
        )
    )

    # Stick qs_1 and qs_2 together
    qs_total = qs_1.union(qs_2)

    # Create object to convert to JSON
    # For now, work only on source fields and values
    for_json = qs_total.values_list(
        "id",
        "source_value__value",
        "source_value__scan_report_field__name",
        "nlp_string",
        "src"
    )
    
    
    # Create small df to hold information the strings sent to NLP
    # Coerce id column from int to str to it can be left joined to
    # the dataframe returned from the NLP service
    strings = pd.DataFrame(list(for_json.values()))
    strings['id']=strings['id'].astype(str)
        
    # Translate queryset into JSON-like dict for NLP
    documents = []
    for row in for_json:
        documents.append(
            {
                "language": "en", 
                "id": row[0], 
                "text": row[3]
                }
        )

    # Define NLP URL/headers
    url = "https://ccnett2.cognitiveservices.azure.com/text/analytics/v3.1-preview.3/entities/health/jobs?stringIndexType=TextElements_v8"
    headers = {
        "Ocp-Apim-Subscription-Key": os.environ.get("NLP_API_KEY"),
        "Content-Type": "application/json; utf-8",
    }

    # POST Request(s)
    # Short wait at end of submission to let the API catch up
    chunk_size = 10  # Set chunk size (max=10)
    post_response_url = []
    for i in range(0, len(documents), chunk_size):
        chunk = {"documents": documents[i : i + chunk_size]}
        payload = json.dumps(chunk)
        response = requests.post(url, headers=headers, data=payload)
        print(response.status_code, response.reason, response.headers["operation-location"])
        post_response_url.append(response.headers["operation-location"])
        
    # GET the response
    get_response = []
    for url in post_response_url:
        
        print("PROCESSING JOB >>>", url)
        req = requests.get(url, headers=headers)
        job = req.json()

        while job["status"] != "succeeded":
            req = requests.get(url, headers=headers)
            job = req.json()
            print("Waiting...")
            time.sleep(3)
        else:
            get_response.append(job["results"])
            print("Done!")
            
    codes = []
    keep = ["ICD9", "ICD10", "RXNORM", "SNOMEDCT_US", "SNOMED"]

    # Mad nested for loops to get at the data in the response
    for url in get_response:
        for dict_entry in url["documents"]:
            for entity in dict_entry["entities"]:
                if "links" in entity.keys():
                    for link in entity["links"]:
                        if link["dataSource"] in keep:
                            codes.append(
                                [
                                    dict_entry["id"],
                                    entity["text"],
                                    entity["category"],
                                    entity["confidenceScore"],
                                    link["dataSource"],
                                    link["id"],
                                ]
                            )

    codes_df = pd.DataFrame(
        codes, columns=["key", "entity", "category", "confidence", "vocab", "code"]
    )
    
    print(codes_df)
        
    # def get_conceptid_from_conceptcode(concept_code, vocabulary):
    #     '''
    #     A small function to return a standard and valid conceptID 
    #     from given vocabulary and concept_code
        
    #     Correct example: get_conceptid_from_conceptcode(concept_code="R51", vocabulary="ICD10")
    #     Incorrect example (Incorrect vocabulary for concept code): 
    #         get_conceptid_from_conceptcode(concept_code="263731006", vocabulary="ICD10")
    #     '''
    #     try:
    #         concept_id=Concept.objects.filter(concept_code=concept_code).filter(vocabulary_id=vocabulary)
    #         return concept_id
    #     except:
    #         print("The supplied concept code/vocabulary combination is incorrect. Please double check.") 
            
    # This block looks up each concept *code* in codes_df 
    # and returns an OMOP standard conceptID
    results = []
    for index, row in codes_df.iterrows():
        # results.append(omop_lookup.lookup_code(row["code"]))
        results.append(Concept.objects.get(concept_code=row["code"], vocabulary_id__in=keep))
        
    # Convert results list into a pandas dataframe    
    full_results = pd.concat(results, ignore_index=True)

    # Left join looked up conceptIDs with the return from NLP
    full_results = full_results.merge(
        codes_df, left_on="concept_code", right_on="code"
    )
        
    full_results = full_results.merge(
        strings, left_on="key", right_on="id"
    )
    
    print(full_results)
            
    full_results = full_results.values.tolist()

    for result in full_results:
        
        if result[30] == "value":
            concept = Concept.objects.get(concept_id=result[11])
            mod = ContentType.objects.get_for_model(ScanReportValue)
            ScanReportConcept.objects.create(
                concept_id = concept,
                nlp_entity = result[14],
                nlp_entity_type = result[15],
                nlp_confidence = result[16],
                nlp_vocabulary = result[3],
                nlp_concept_code = result[6],
                nlp_processed_string = result[29],
                
                content_type = mod,
                object_id = result[13],
        )
            
        else:
            obj = ScanReportValue.objects.get(id=result[13])
            pk = obj.scan_report_field.id
            mod = ContentType.objects.get_for_model(ScanReportField)
            
            ScanReportConcept.objects.create(
                concept_id = result[11],
                nlp_entity = result[14],
                nlp_entity_type = result[15],
                nlp_confidence = result[16],
                nlp_vocabulary = result[3],
                nlp_concept_code = result[6],
                nlp_processed_string = result[29],
                
                content_type = mod,
                object_id = pk,
            )
        
    # This function is called from services_nlp.py
    # nlp_request(search_term=search_term)
    
    return render(request, "mapping/home.html")
    obj = DataDictionary.objects.get(
                source_value__scan_report_field__name=row["Source_Field"],
                source_value__value=row["Source_Value"],
            )

@method_decorator(login_required, name="dispatch")
class NLPResultsListView(ListView):
    model = ScanReportConcept
    

def save_scan_report_value_concept(request):
    if request.method == "POST":
        form = ScanReportValueConceptForm(request.POST)
        if form.is_valid():

            scan_report_value = ScanReportValue.objects.get(
                pk=form.cleaned_data['scan_report_value_id']
            )

            try:
                concept = Concept.objects.get(
                    concept_id=form.cleaned_data['concept_id']
                )
            except Concept.DoesNotExist:
                messages.error(request,
                                 "Concept id {} does not exist in our database.".format(form.cleaned_data['concept_id']))
                return redirect("/values/?search={}".format(scan_report_value.scan_report_field.id))

            scan_report_concept = ScanReportConcept.objects.create(
                concept=concept,
                content_object=scan_report_value,
            )

            messages.success(request, "Concept {} - {} added successfully.".format(concept.concept_id, concept.concept_name))

            return redirect("/values/?search={}".format(scan_report_value.scan_report_field.id))


def delete_scan_report_value_concept(request):
    scan_report_field_id = request.GET.get('scan_report_field_id')
    scan_report_concept_id = request.GET.get('scan_report_concept_id')

    scan_report_concept = ScanReportConcept.objects.get(pk=scan_report_concept_id)

    concept_id = scan_report_concept.concept.concept_id
    concept_name = scan_report_concept.concept.concept_name

    scan_report_concept.delete()

    messages.success(request, "Concept {} - {} removed successfully.".format(concept_id, concept_name))

    return redirect("/values/?search={}".format(scan_report_field_id))


def save_scan_report_field_concept(request):
    if request.method == "POST":
        form = ScanReportFieldConceptForm(request.POST)
        if form.is_valid():
            
            scan_report_field = ScanReportField.objects.get(
                pk=form.cleaned_data['scan_report_field_id']
            )

            try:
                concept = Concept.objects.get(
                    concept_id=form.cleaned_data['concept_id']
                )
            except Concept.DoesNotExist:
                messages.error(request,
                                 "Concept id {} does not exist in our database.".format(form.cleaned_data['concept_id']))
                return redirect("/fields/?search={}".format(scan_report_field.scan_report_table.id))

            scan_report_concept = ScanReportConcept.objects.create(
                concept=concept,
                content_object=scan_report_field,
            )

            messages.success(request, "Concept {} - {} added successfully.".format(concept.concept_id, concept.concept_name))

            return redirect("/fields/?search={}".format(scan_report_field.scan_report_table.id))


def delete_scan_report_field_concept(request):
    
    scan_report_table_id=request.GET.get('scan_report_table_id')
    scan_report_concept_id = request.GET.get('scan_report_concept_id')

    scan_report_concept = ScanReportConcept.objects.get(pk=scan_report_concept_id)

    concept_id = scan_report_concept.concept.concept_id
    concept_name = scan_report_concept.concept.concept_name

    scan_report_concept.delete()

    messages.success(request, "Concept {} - {} removed successfully.".format(concept_id, concept_name))

    return redirect("/fields/?search={}".format(scan_report_table_id))
