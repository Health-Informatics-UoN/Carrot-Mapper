import ast
import json
from io import StringIO

from .services_rules import Concept2OMOP

from coconnect.tools import dag, mapping_pipeline_helpers
from coconnect.tools.omop_db_inspect import OMOPDetails
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
from django.views.generic import DetailView, ListView
from django.views.generic.edit import FormView, UpdateView
from extra_views import ModelFormSetView

from data.models import Concept, ConceptRelationship
from .forms import (
    DictionarySelectForm,
    DocumentFileForm,
    DocumentForm,
    NLPForm,
    ScanReportAssertionForm,
    ScanReportForm,
    UserCreateForm, ScanReportValueConceptForm,
)
from .models import (
    DataDictionary,
    Document,
    DocumentFile,
    NLPModel,
    OmopField,
    OmopTable,
    ScanReport,
    ScanReportAssertion,
    ScanReportField,
    ScanReportTable,
    ScanReportValue,
    StructuralMappingRule, ScanReportConcept,
)
from .services_datadictionary import merge_external_dictionary
from .services_nlp import get_json_from_nlpmodel
from .services import find_standard_concept
from .tasks import (
    nlp_single_string_task,
    process_scan_report_task,
)


m_allowed_tables = ['person','measurement','condition_occurrence','observation']
def get_omop_field(destination_field,destination_table=None):
    if destination_table == None:
        omop_field = OmopField.objects\
                               .filter(table__table__in=m_allowed_tables)\
                               .get(field=destination_field)
    else:
        omop_field = OmopField.objects\
                              .filter(table__table=destination_table)\
                              .get(field=destination_field)
        
    
    
    return omop_field



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
class ScanReportFieldListView(ModelFormSetView):
    model = ScanReportField
    fields = ["is_patient_id", "date_type", "concept_id"]
    fields = ["is_patient_id", "is_birth_date", "is_date_event", "concept_id"]
    fields = ["concept_id"]
    # exclude = []
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
class StructuralMappingTableListView(ModelFormSetView):
    # fields = ['source_table','source_field','operation','approved']
    fields = ["approved"]
    factory_kwargs = {"can_delete": False, "extra": False}

    model = StructuralMappingRule

    template_name = "mapping/mappingrulesscanreport_list.html"

    def json_to_svg(self, data):
        return dag.make_dag(data)

    def get_final_json(self, _mapping_data, tables=None, source_tables=None):

        _id_map = self.get_person_id_mapping()

        # these two inputs shouldnt be so complicated
        # it's because _mapping_data is read by pd.read_json(blah)
        # and _id_map is read by json.loads(open(blah))
        #
        # all because with this function
        # you can input these are paths to files

        f_mapping = StringIO(json.dumps(_mapping_data))
        f_ids = StringIO(json.dumps(_id_map))

        structural_mapping = mapping_pipeline_helpers.StructuralMapping.to_json(
            f_mapping,
            f_ids,
            filter_destination_tables=tables,
            filter_source_tables=source_tables,
        )

        return structural_mapping

    def clean(self):
        StructuralMappingRule.objects.all().delete()

    # need a quality check if multiple date events are found in the table
    def find_date_event(self,destination_table,source_table):
        lookup = {
            'person':'birth_date',
            'measurement':'measurement_date',
            'condition_occurrence':'condition_date',
            'observation':'observation_date'
        }

        field = lookup[destination_table]

        return getattr(source_table,field)

    def find_person_id(self, source_table):
        return source_table.person_id

    def validate_person_ids(self,request,source_tables):
        is_valid = True
        #loop over source_tables looking for person_ids
        for table in source_tables:
            if table.person_id == None:
                messages.error(request,f"Cannot generate rules. Table \"{table.name}\" is used but you have not set the person_id.")
                is_valid = False
                
        return is_valid
    
    def generate(self, request):
        omop_lookup = OMOPDetails()

        pk = self.kwargs.get("pk")

        # retrieve old ones (dates and person ids)
        # self.retrieve(request,pk)

        # do the rest... automatic lookup based on concept id

        scan_report = ScanReport.objects.get(pk=pk)

        # this is taking a long time to run/filter
        # find all fields that have been mapped with a concept id (>=0, default=-1)
        fields = ScanReportField.objects.filter(
            scan_report_table__scan_report=scan_report
        )
        # find fields that have a concept_id set,
        # OR find fields that have at least one value with a concept_id set
        fields = fields.filter(scanreportvalue__conceptID__gte=0) | fields.filter(
            concept_id__gte=0
        )

        # make unique
        fields = fields.distinct()

        #get unique source tables that are used
        source_tables = []
        for field in fields:
            source_table = field.scan_report_table
            source_tables.append(source_table)
        source_tables = list(set(source_tables))

        #call a check to firstly validate that person_ids have been set
        #in all the source tables that we actually use
        if not self.validate_person_ids(request,source_tables):
            return 

        # loop over found fields
        for field in fields:
            # get the field and associated table
            source_field = field
            source_table = field.scan_report_table

            # add info here

            # if the source field (column) has a concept_id set, use this..
            if source_field.concept_id >= 0:
                concepts = source_field.concept_id
            # otherwise find all field values with a concept_id set
            else:
                values = field.scanreportvalue_set.all().filter(conceptID__gte=0)

                # map the source value to the raw value
                #concepts = {value.value: value.conceptID for value in values}
                #messages.warning(request, concepts)
                #print (concepts)


            # use the OmopDetails class to look up rules for these concepts
            try:
                rules_set = omop_lookup.get_rules(concepts)
            except Exception as e:
                # need to handle this better
                # print (e)
                messages.warning(request, e)
                # print (f"{field} failed")
                continue

            # temp hack/filter!!
            allowed_destination_tables = [
                "person",
                "condition_occurrence",
                "observation",
                "measurement",
            ]

            # loop over the destination and rule set for each domain found
            for destination_table, rules in rules_set.items():
                # temp hack to stop generating rules for the 'big 4'
                if destination_table not in allowed_destination_tables:
                    continue

                for destination_field, term_mapping in rules.items():
                    try:
                        omop_field = OmopField.objects.get(
                            table__table=destination_table, field=destination_field
                        )
                    except Exception as err:
                        # remove message warnings about these now
                        # rules are automatically generated for:
                        # <domain>_source_value, <domain>_source_concept_id and <domain>_concept_id
                        # sometimes one of these might not exist, e.g. for specimen
                        # do not make a warning about this
                        if all(
                            x not in destination_field
                            for x in [
                                "_source_value",
                                "_source_concept_id",
                                "_concept_id",
                            ]
                        ):
                            messages.warning(
                                request,
                                f"{destination_table}::{destination_field} is somehow misssing??",
                            )
                        continue

                    # create a new model
                    mapping, created = StructuralMappingRule.objects.update_or_create(
                        scan_report=scan_report,
                        omop_field=omop_field,
                        source_table=source_table,
                        source_field=source_field,
                        term_mapping=json.dumps(
                            term_mapping, indent=6
                        ),  # convert dict to str,
                        approved=True,
                    )
                    mapping.save()

                    # add mapping for person id
                    # find the field in the table that is marked as person_d
                    person_id_source_field = self.find_person_id(source_table)
                    # get the associated OmopField Object (aka destination_table::person_id)
                    person_id_omop_field = OmopField.objects.get(
                        table__table=destination_table, field="person_id"
                    )
                    # create/update a new rule for this
                    # - this is going to be called multiple times needlessly,
                    #  it could be broken out of this loop
                    #  "update" should save us need to check if already exists
                    mapping, created = StructuralMappingRule.objects.update_or_create(
                        scan_report=scan_report,
                        omop_field=person_id_omop_field,
                        source_table=source_table,
                        source_field=person_id_source_field,
                        term_mapping=None,
                        approved=True,
                    )
                    mapping.save()
                    try:
                        primary_date_source_field = self.find_date_event(destination_table,source_table)
                    except KeyError:
                        messages.error(request,f"No implementation for date-event for {destination_table} yet")
                        
                    if primary_date_source_field is None:
                        messages.error(request,f"Failed to generate rules. You need to set an event date for {destination_table} in table {source_table.name}.")
                        self.clean()
                        return

                    # this is just looking up a dictionary in the OmopDetails() class
                    # e.g. { "person":["birth_datetime"]... }
                    # this could easily be in MappingPipelines
                    date_omop_fields = omop_lookup.get_date_fields(
                        omop_field.table.table
                    )
                    #loop over all returned
                    #most will return just one
                    #in the case of condition_occurrence, return start and end
                    for date_omop_field in date_omop_fields:
                        # get the actual omop field object
                        date_omop_field = OmopField.objects.get(
                            table__table=destination_table, field=date_omop_field
                        )
                        
                        # make another mapping for this date object
                        mapping, created = StructuralMappingRule.objects.update_or_create(
                            scan_report=scan_report,
                            omop_field=date_omop_field,
                            source_table=source_table,
                            source_field=primary_date_source_field,
                            term_mapping=None,
                            approved=True,
                        )
                        mapping.save()
                    # loop over dates to be added
                # loop over rules
            # loop over rules set
        # loop over all fields containing a concept id

    def download_structural_mapping(self, request, return_type="json"):
        pk = self.kwargs.get("pk")

        scan_report = ScanReport.objects.get(pk=pk)

        rules = StructuralMappingRule.objects.filter(scan_report=scan_report)
        # .order_by('omop_field__table','omop_field__field','source_table__name','source_field__name')

        outputs = []

        for rule in rules:
            # if these havent been defined, skip.....
            if rule.source_table is None:
                continue
            if rule.source_field is None:
                continue
            # skip if the rule hasnt been approved
            if not rule.approved:
                continue

            output = {}
            output["rule_id"] = rule.id
            output["destination_table"] = rule.omop_field.table.table
            output["destination_field"] = rule.omop_field.field

            output["source_table"] = rule.source_table.name
            output["source_field"] = rule.source_field.name
            output["source_field_indexer"] = rule.source_field.is_patient_id

            # this needs to be updated if there is a coding system
            output["coding_system"] = None  # "user defined")

            output["term_mapping"] = None
            if rule.term_mapping:
                output["term_mapping"] = json.loads(rule.term_mapping)

            # need to implement multiple operations, one day
            operations = None
            if rule.operation and rule.operation != "NONE":
                operations = [rule.operation]
            output["operations"] = operations
            outputs.append(output)

        if len(outputs) == 0:
            messages.error(
                request,
                "Can't download or create json. Most likely because nothing has been approved.",
            )
            return redirect(request.path)

        # define the name of the output file
        fname = f"{scan_report.data_partner}_{scan_report.dataset}_structural_mapping.{return_type}"

        if return_type == "svg":
            fname = (
                f"{scan_report.data_partner}"
                f"_{scan_report.dataset}_structural_mapping.json"
            )

            tables = None
            table = self.kwargs.get("omop_table")
            if table is not None:
                tables = [table]

            source_tables = None
            source_table = self.kwargs.get("source_table")
            if source_table is not None:
                source_tables = [source_table]

            outputs = self.get_final_json(
                outputs, tables=tables, source_tables=source_tables
            )

            svg_output = self.json_to_svg(outputs["cdm"])

            return HttpResponse(svg_output, content_type="image/svg+xml")

        elif return_type == "json":
            outputs = self.get_final_json(outputs)
            response = HttpResponse(json.dumps(outputs,indent=6),content_type='application/json')
            response['Content-Disposition'] = f'attachment; filename="{fname}"'
            return response
        else:
            # implement other return types if needed
            return redirect(request.path)

    def get_person_id_mapping(self):
        pk = self.kwargs.get("pk")
        patient_id_fields = ScanReportField.objects.filter(
            scan_report_table__scan_report=pk
        ).filter(is_patient_id=True)

        patient_id_map = {
            patient_field.scan_report_table.name: patient_field.name
            for patient_field in patient_id_fields
        }

        return patient_id_map

    def post(self, request, *args, **kwargs):
        #
        if request.POST.get("download-sm") is not None:
            return self.download_structural_mapping(request)
        elif request.POST.get("generate") is not None:
            self.generate(request)
            return redirect(request.path)
        elif request.POST.get("clean") is not None:
            self.clean()
            return redirect(request.path)
        elif request.POST.get("svg") is not None:
            return self.download_structural_mapping(request, return_type="svg")
        else:
            super().post(request, *args, **kwargs)
            pass

        return redirect(request.path)

    def get_context_data(self, **kwargs):

        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)

        scan_report = ScanReport.objects.get(pk=self.kwargs.get("pk"))

        #omop_tables = [
        #    x.omop_field.table.table
        #    for x in StructuralMappingRule.objects.all().filter(scan_report=scan_report)
        #]
        #omop_tables = list(set(omop_tables))
        #omop_tables.sort()

        # check to see if the user has asked to filter on a table
        # e.g. person
        filtered_omop_table = None#self.kwargs.get("omop_table")

        source_tables = []
        if filtered_omop_table:
            # find all source tables that are mapping to this table
            # so we can pass this context as an additional filter
            source_tables = [
                x.source_table.name
                for x in StructuralMappingRule.objects.all().filter(
                    scan_report=scan_report,
                    omop_field__table__table=filtered_omop_table,
                )
            ]

            source_tables = list(set(source_tables))
            source_tables.sort()

            # if there's only one source table
            # dont bother allowing a filter on differing tables as its pointless
            if len(source_tables) == 1:
                source_tables = []

        context.update(
            {
                #"omop_tables": omop_tables,
                "scan_report": scan_report,
                "filtered_omop_table": filtered_omop_table,
                "source_tables": source_tables,
            }
        )

        return context

    def get_queryset(self):

        qs = super().get_queryset()
        search_term = self.kwargs.get("pk")
        destination_table_filter_term = self.kwargs.get("omop_table")
        source_table_filter_term = self.kwargs.get("source_table")

        if search_term is not None:
            qs = qs.filter(scan_report__id=search_term)
            #.order_by(
                #"omop_field__table",
                #"omop_field__field",
            #    "source_table__name",
            #    "source_field__name",
            #)

            if destination_table_filter_term is not None:
                qs = qs.filter(omop_field__table__table=destination_table_filter_term)

                if source_table_filter_term is not None:
                    qs = qs.filter(source_table__name=source_table_filter_term)

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


def save_mapping_rules(request,scan_report_concept):
    scan_report_value = scan_report_concept.content_object
    source_field = scan_report_value.scan_report_field
    scan_report = source_field.scan_report_table.scan_report
    concept = scan_report_concept.concept
    domain = concept.domain_id.lower()

    #!--- need a way to implement pointing at the source_concept_id instead of concept_id
    # create/update a model for the domain source_concept_id
    #  - for this destination_field and source_field
    #  - do_term_mapping is set to true:
    #    - all term mapping rules associated need to be applied
    rule_domain_source_concept_id, created = StructuralMappingRule.objects.update_or_create(
        scan_report=scan_report,
        omop_field=get_omop_field(f"{domain}_source_concept_id"),
        source_field=source_field,
        do_term_mapping=True,
        use_source_concept_id=True,# need to implement something like this
        approved=True,
    )
    #add this new concept mapping
    rule_domain_source_concept_id.concepts.add(scan_report_concept)
    rule_domain_source_concept_id.save()


    # create/update a model for the domain concept_id
    #  - for this destination_field and source_field
    #  - do_term_mapping is set to true:
    #    - all term mapping rules associated need to be applied
    rule_domain_concept_id, created = StructuralMappingRule.objects.update_or_create(
        scan_report=scan_report,
        omop_field=get_omop_field(f"{domain}_concept_id"),
        source_field=source_field,
        do_term_mapping=True,
        approved=True,
    )
    #add this new concept mapping
    rule_domain_concept_id.concepts.add(scan_report_concept)
    rule_domain_concept_id.save()


    # create/update a model for the domain source_value
    #  - for this destination_field and source_field
    #  - do_term_mapping is set to false
    rule_domain_source_value, created = StructuralMappingRule.objects.update_or_create(
        scan_report=scan_report,
        omop_field=get_omop_field(f"{domain}_source_value"),
        source_field=source_field,
        do_term_mapping=False,
        approved=True,
    )
    #add this new concept mapping
    # - the concept wont be used, because  do_term_mapping=False
    # - but we need to preserve the link,
    #   so when all associated concepts are deleted, the rule is deleted
    rule_domain_source_value.concepts.add(scan_report_concept)
    rule_domain_source_value.save()


    if domain == 'measurement':
        # create/update a model for the domain value_as_number
        #  - for this destination_field and source_field
        #  - do_term_mapping is set to false
        rule_domain_value_as_number, created = StructuralMappingRule.objects.update_or_create(
            scan_report=scan_report,
            omop_field=get_omop_field("value_as_number","measurement"),
            source_field=source_field,
            do_term_mapping=False,
            approved=True,
        )
        #add this new concept mapping
        # - the concept wont be used, because  do_term_mapping=False
        # - but we need to preserve the link,
        #   so when all associated concepts are deleted, the rule is deleted
        rule_domain_value_as_number.concepts.add(scan_report_concept)
        rule_domain_value_as_number.save()
        
    


        
def save_scan_report_value_concept(request):
    if request.method == "POST":
        form = ScanReportValueConceptForm(request.POST)
        if form.is_valid():

            scan_report_value = ScanReportValue.objects.get(
                pk=form.cleaned_data['scan_report_value_id']
            )
            
            try:
                source_concept = Concept.objects.get(
                    concept_id=form.cleaned_data['concept_id']
                )
            except Concept.DoesNotExist:
                messages.error(request,
                                 "Source Concept id {} does not exist in our database.".format(form.cleaned_data['concept_id']))
                return redirect("/values/?search={}".format(scan_report_value.scan_report_field.id))



            concept = find_standard_concept(source_concept)
            #messages.error(request,
            #               "error obtaining the concept relationship")
            #return redirect("/values/?search={}".format(scan_report_value.scan_report_field.id))

                
            scan_report_concept = ScanReportConcept.objects.create(
                source_concept=source_concept,
                concept=concept,
                content_object=scan_report_value,
            )

            if concept == source_concept:
                messages.success(request, "Concept {} - {} added successfully.".format(concept.concept_id, concept.concept_name))
            else:
                messages.warning(request,"Non-Standard Concept ID found")
                messages.success(request, "Source Concept {} - {} will be used as source_concept_id.".format(source_concept.concept_id, source_concept.concept_name))
                messages.success(request, "Concept {} - {} will be used as the concept_id".format(concept.concept_id, concept.concept_name))
                
                


            save_mapping_rules(request,scan_report_concept)
            

            
            return redirect("/values/?search={}".format(scan_report_value.scan_report_field.id))


def delete_scan_report_value_concept(request):
    scan_report_field_id = request.GET.get('scan_report_field_id')
    scan_report_concept_id = request.GET.get('scan_report_concept_id')

    scan_report_concept = ScanReportConcept.objects.get(pk=scan_report_concept_id)

    #get the associated structural mapping rules
    structural_mapping_rules = scan_report_concept.structuralmappingrule_set.all()

    #loop over the associated structural mapping rules
    for rule in structural_mapping_rules:
        #if this rule now has no other associated concepts
        if rule.concepts.count() < 2:
            #then delete it!
            msg = rule.delete()

    
    concept_id = scan_report_concept.concept.concept_id
    concept_name = scan_report_concept.concept.concept_name

    scan_report_concept.delete()

    
    messages.success(request, "Concept {} - {} removed successfully.".format(concept_id, concept_name))

    return redirect("/values/?search={}".format(scan_report_field_id))
