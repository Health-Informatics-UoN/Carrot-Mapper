from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordResetForm, PasswordChangeForm
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.views import PasswordChangeView, PasswordChangeDoneView
from django.core.mail import message, send_mail, BadHeaderError
from django.db.models.query_utils import Q
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.urls import reverse
from django.urls import reverse_lazy
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from django.views import generic
from django.views.generic import ListView
from django.views.generic.edit import FormView, UpdateView, DeleteView, CreateView
from extra_views import ModelFormSetView
import os
import sys
from .forms import (
    ScanReportForm,
    UserCreateForm,
    AddMappingRuleForm,
    DocumentForm,
    DocumentFileForm,
    DictionarySelectForm
)
from .models import (
    ScanReport,
    ScanReportValue,
    ScanReportField,
    ScanReportTable,
    StructuralMappingRule,
    OmopTable,
    OmopField,
    DocumentFile,
    Document,
    DataDictionary,
)
from .tasks import process_scan_report_task, run_usagi_task

from .services import process_scan_report, run_usagi
from .tasks import process_scan_report_task, run_usagi

import pandas as pd
import json

from io import StringIO

import coconnect
from coconnect.tools import dag
from coconnect.tools import mapping_pipeline_helpers


from coconnect.tools.omop_db_inspect import OMOPDetails
omop_lookup = OMOPDetails()

@login_required
def home(request):
    return render(request, "mapping/home.html", {})

@method_decorator(login_required,name='dispatch')
class ScanReportTableListView(ListView):
    model = ScanReportTable

    def get_queryset(self):
        qs = super().get_queryset()
        search_term = self.request.GET.get("search", None)
        if search_term is not None and search_term is not "":
            qs = qs.filter(scan_report__id=search_term).order_by('name')
            
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


@method_decorator(login_required,name='dispatch')
class ScanReportFieldListView(ModelFormSetView):
    model = ScanReportField
    fields = ["is_patient_id","date_type","concept_id"]
    #exclude = []
    factory_kwargs = {"can_delete": False, "extra": False}
    def get_queryset(self):
        qs = super().get_queryset().order_by('id')
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


@method_decorator(login_required,name='dispatch')
class ScanReportFieldUpdateView(UpdateView):
    model = ScanReportField
    fields = [
        'is_patient_id',
        'is_date_event',
        'date_type',
        'is_ignore',
        'pass_from_source',
        'classification_system',
    ]

    def get_success_url(self):
        return "{}?search={}".format(
            reverse("fields"), self.object.scan_report_table.id
        )

@method_decorator(login_required,name='dispatch')
class ScanReportStructuralMappingUpdateView(UpdateView):
    model = ScanReportField
    fields = ["mapping"]

    def get_success_url(self):
        return "{}?search={}".format(
            reverse("fields"), self.object.scan_report_table.id
        )

@method_decorator(login_required,name='dispatch')
class ScanReportListView(ListView):
    model = ScanReport


@method_decorator(login_required,name='dispatch')
class ScanReportValueListView(ModelFormSetView):
    model = ScanReportValue
    fields = ["conceptID"]
    factory_kwargs = {"can_delete": False, "extra": False}

    def get_queryset(self):
         qs = super().get_queryset().order_by('id')
         search_term = self.request.GET.get('search', None)
         if search_term is not None:
             qs = qs.filter(scan_report_field=search_term)
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


@method_decorator(login_required,name='dispatch')
class AddMappingRuleFormView(FormView):
    form_class = AddMappingRuleForm
    template_name = "mapping/mappingrule_form.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        scan_report_field = ScanReportField.objects.get(pk=self.kwargs.get("pk"))

        scan_report = scan_report_field.scan_report_table.scan_report
        scan_report_table = scan_report_field.scan_report_table
        scan_report_field = scan_report_field

        context.update(
            {
                "scan_report": scan_report,
                "scan_report_table": scan_report_table,
                "scan_report_field": scan_report_field,
            }
        )

        return context

    def form_valid(self, form):

        scan_report_field = ScanReportField.objects.get(pk=self.kwargs.get("pk"))

        mapping,created = MappingRule.objects.get_or_create(
            omop_field=form.cleaned_data['omop_field'],
            operation=form.cleaned_data['operation'],
            scan_report_field=scan_report_field,
        )
        mapping.save()
        return super().form_valid(form)

    def get_success_url(self):
        scan_report_field = ScanReportField.objects.get(pk=self.kwargs.get("pk"))

        return "{}?search={}".format(
            reverse("fields"), scan_report_field.scan_report_table.id
        )


# @method_decorator(login_required,name='dispatch')
# class StructuralMappingDeleteView(DeleteView):
#     model = MappingRule

#     def get_success_url(self):
#         scan_report_field = ScanReportField.objects.get(pk=self.kwargs.get("pk"))

#         return "{}?search={}".format(
#             reverse("fields"), scan_report_field.scan_report_table.id
#         )

#     success_url = reverse_lazy("fields")


# @method_decorator(login_required,name='dispatch')
# class StructuralMappingListView(ListView):
#     model = MappingRule
    
#     def get_queryset(self):
#         qs = super().get_queryset()
#         search_term = self.kwargs.get("pk")
#         if search_term is not None:
#             qs = qs.filter(scan_report_field=search_term)
#         return qs

#     def get_context_data(self, **kwargs):
#         # Call the base implementation first to get a context
#         context = super().get_context_data(**kwargs)

#         if len(self.get_queryset()) > 0:
#             scan_report = self.get_queryset()[
#                 0
#             ].scan_report_field.scan_report_table.scan_report
#             scan_report_table = self.get_queryset()[
#                 0
#             ].scan_report_field.scan_report_table
#             scan_report_field = self.get_queryset()[0]
#         else:
#             scan_report = None
#             scan_report_table = None
#             scan_report_field = None

#         context.update(
#             {
#                 "scan_report": scan_report,
#                 "scan_report_table": scan_report_table,
#                 "scan_report_field": scan_report_field,
#             }
#         )

#         return context



# Calum - adding this, if we want to switch to form list edit view
#class StructuralMappingTableListView(ModelFormSetView):
    #model = ScanReportField
    #form_class = ScanReportForm
    #exclude = []
    #factory_kwargs = {"can_delete": False, "extra": False}
    
@method_decorator(login_required,name='dispatch')
class StructuralMappingTableListView(ListView):
#class StructuralMappingTableListView(ModelFormSetView):
    ### exclude = []
    ### factory_kwargs = {"can_delete": False, "extra": False}

    #model = MappingRule
    #model = ScanReportField
    model = StructuralMappingRule
    
    template_name = "mapping/mappingrulesscanreport_list.html"


    def json_to_svg(self,data):
        return dag.make_dag(data)
            
    def get_final_json(self,_mapping_data,tables=None):
        
        structural_mapping = mapping_pipeline_helpers\
            .StructuralMapping\
            .to_json(StringIO(json.dumps(_mapping_data)),
                     destination_tables = tables)
                             
        return structural_mapping
        


    def retrieve(self,request,pk):
        scan_report = ScanReport.objects.get(pk=pk)

        patient_id_fields = ScanReportField\
            .objects\
            .filter(scan_report_table__scan_report=scan_report)\
            .filter(is_patient_id=True)

        if len(patient_id_fields)>0:
            patient_id_field = patient_id_fields[0]
            omop_fields = OmopField.objects\
                                   .filter(field='person_id')\
                                   .filter(table__table__in=[
                                       #only do it for these tables for now
                                       'person',
                                       'observation',
                                       'conditon_occurrence',
                                       'visit_occurrence',
                                       'measurement',
                                   ])
            
            for omop_field in omop_fields:
                #create a new model 
                mapping,created = StructuralMappingRule.objects.get_or_create(
                    scan_report  = scan_report,
                    omop_field   = omop_field,
                    source_table = patient_id_field.scan_report_table,
                    source_field = patient_id_field,
                    term_mapping = "null"
                )
                mapping.save()

        date_fields = ScanReportField\
            .objects\
            .filter(scan_report_table__scan_report=scan_report)\
            .filter(date_type__gt=0)
        

        for date_field in date_fields:

            omop_field = OmopField.objects\
                                  .get(field=date_field.date_type)

            mapping,created = StructuralMappingRule.objects.get_or_create(
                scan_report  = scan_report,
                omop_field   = omop_field,
                source_table = date_field.scan_report_table,
                source_field = date_field,
                term_mapping = "null"
            )
            mapping.save()
        

    def clean(self):
        StructuralMappingRule.objects.all().delete()
            
    def generate(self,request,pk):

        #retrieve old ones (dates and person ids)
        self.retrieve(request,pk)

        #do the rest... automatic lookup based on concept id
        
        scan_report = ScanReport.objects.get(pk=pk)

        #this is taking a long time to run/filter
        #find all fields that have been mapped with a concept id (>=0, default=-1)
        fields = ScanReportField.objects\
                            .filter(scan_report_table__scan_report=scan_report)
        #find fields that have a concept_id set,
        #OR find fields that have at least one value with a concept_id set
        fields = fields.filter(scanreportvalue__conceptID__gte=0)\
            | fields.filter(concept_id__gte=0)
        
        #make unique
        fields = fields.distinct()

        #loop over found fields
        for field in fields:
            #get the field and associated table
            source_field = field
            source_table = field.scan_report_table

            #add info here

            #if the source field (column) has a concept_id set, use this..
            if source_field.concept_id >= 0 :
                concepts = source_field.concept_id
            #otherwise find all field values with a concept_id set
            else:
                values = field.scanreportvalue_set\
                              .all()\
                              .filter(conceptID__gte=0)
                
                #map the source value to the raw value
                concepts = {
                    value.value: value.conceptID
                    for value in values
                }

            #use the OmopDetails class to look up rules for these concepts
            try:
                rules = omop_lookup.get_rules(concepts)
            except Exception as e:
                print (e)
                print (f"{field} failed")
                continue

            #loop over the rules it has found
            for destination,term_mapping in rules.items():

                #find associated omop tables with this field (destination field)
                omop_fields = OmopField.objects\
                                      .filter(field=destination)
                
                #loop over multiple fields
                #example:  gender_concept_id appears in 'person' and in 'provider'
                #          so need to use the field twice...
                
                for omop_field in omop_fields:
                    #create a new model 
                    mapping,created = StructuralMappingRule.objects.update_or_create(
                        scan_report  = scan_report,
                        omop_field   = omop_field,
                        source_table = source_table,
                        source_field = source_field,
                        term_mapping = json.dumps(term_mapping,indent=6)#convert dict to str,
                    )
                    mapping.save()
            
            
    def download_structural_mapping(self,request,pk,return_type='json'):
        scan_report = ScanReport.objects.get(pk=pk)

        rules = StructuralMappingRule\
            .objects\
            .filter(scan_report=scan_report)

        
        outputs = []
        #output={ name:None for name in ['rule_id','destination_table','destination_field','source_table','source_field','source_field_indexer','term_mapping','coding_system','operation']}

        for rule in rules:
            output = {}
            output['rule_id'] = rule.id
            output['destination_table'] = rule.omop_field.table.table
            output['destination_field'] = rule.omop_field.field

            output['source_table'] = rule.source_table.name
            output['source_field'] = rule.source_field.name
            output['source_field_indexer'] = rule.source_field.is_patient_id
            
            #this needs to be updated if there is a coding system
            output['coding_system'] = None#"user defined")

            output['term_mapping'] = json.loads(rule.term_mapping)
            
            output['operation'] = None#rule.operation)
            outputs.append(output)

        #define the name of the output file
        fname = f"{scan_report.data_partner}_{scan_report.dataset}_structural_mapping.{return_type}"
        
        if return_type == 'svg':
            fname = f"{scan_report.data_partner}"\
                f"_{scan_report.dataset}_structural_mapping.json"

            if 'omop_table' in self.kwargs:
                outputs = self.get_final_json(outputs,tables=[self.kwargs['omop_table']])
            else:
                outputs = self.get_final_json(outputs)
                
            svg_output = self.json_to_svg(outputs)
            
            return HttpResponse(svg_output,content_type='image/svg+xml')
                        
        elif return_type == 'json':
            outputs = self.get_final_json(outputs)
            response = HttpResponse(json.dumps(outputs,indent=6), content_type='application/json')
            response['Content-Disposition'] = f'attachment; filename="{fname}"'
            return response
        else:
            #implement other return types if needed
            return redirect(request.path)

        
    # def download_term_mapping(self,request,pk):
    #      #define the name of the output file

    #     scan_report = ScanReport.objects.get(pk=pk)

    #     rules = StructuralMappingRule\
    #         .objects\
    #         .filter(scan_report=scan_report)

    #     output = { name:[] for name in ['rule_id','source_term','destination_term']}

    #     for rule in rules:
    #         for obj in rule.scan_report_field.scanreportvalue_set.all():
    #             if obj.conceptID == -1:
    #                 continue
                
    #             output['rule_id'].append(rule.id)
    #             output['source_term'].append(obj.value)
    #             output['destination_term'].append(obj.conceptID)


    #     return_type = 'csv'
    #     fname = f"{scan_report.data_partner}_{scan_report.dataset}_term_mapping.{return_type}"

    
    #     result = ",".join(f'"{key}"' for key in output.keys())
    #     for irow in range(len(output['rule_id'])):
    #         result+='\n'+ ",".join(f'"{output[key][irow]}"' for key in output.keys())
            
    #     response = HttpResponse(result, content_type='text/csv')
    #     response['Content-Disposition'] = f'attachment; filename="{fname}"'
    #     return response

    def download_pk_mapping(self,request,pk):

        patient_id_fields = ScanReportField.objects.filter(scan_report_table__scan_report=pk)\
                                             .filter(is_patient_id=True)
        
        patient_id_map = {
            patient_field.scan_report_table.name : patient_field.name
            for patient_field in patient_id_fields
        }

        scan_report = ScanReport.objects.get(pk=pk)
        return_type = 'json'
        fname = f"{scan_report.data_partner}_{scan_report.dataset}_person_id_mapping.{return_type}"

        response = HttpResponse(json.dumps(patient_id_map,indent=6), content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename="{fname}"'
        return response
    
    def post(self,request,*args, **kwargs):

        pk = self.kwargs.get('pk')
        if request.POST.get('download-sm') is not None:
            return self.download_structural_mapping(request,pk)
        elif request.POST.get('download-tm') is not None:
            return self.download_term_mapping(request,pk)
        elif request.POST.get('download-pk') is not None:
            return self.download_pk_mapping(request,pk)
        elif request.POST.get('generate') is not None:
            self.generate(request,pk)
            return redirect(request.path)
        elif request.POST.get('clean') is not None:
            self.clean()
            return redirect(request.path)
        elif request.POST.get('retrieve') is not None:
            self.retrieve(request,pk)
            return redirect(request.path)
        elif request.POST.get('svg') is not None:
            return self.download_structural_mapping(request,pk,return_type='svg')
        else:
            #define more buttons to click
            pass

        
        return redirect(request.path)

    
    def get_context_data(self, **kwargs):
                
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)

        scan_report = ScanReport.objects.get(pk=self.kwargs.get("pk"))

        omop_tables = [
            x.omop_field.table.table
            for x in StructuralMappingRule.objects.all().filter(scan_report=scan_report)
        ]
        
        omop_tables = list(set(omop_tables))
        omop_tables.sort()
        
        context.update(
            {
                "omop_tables" : omop_tables,
                "scan_report": scan_report,
            }
        )

        return context

    def get_queryset(self):
        scan_report = ScanReport.objects.get(pk=self.kwargs.get("pk"))

        
        qs = super().get_queryset()
        search_term = self.kwargs.get("pk")
        filter_term = self.kwargs.get("omop_table")
        
        
        if search_term is not None:
            qs = qs.filter(scan_report__id=search_term)\
                   .order_by('omop_field__table','omop_field__field')

            if filter_term is not None:
                qs = qs.filter(omop_field__table__table=filter_term)
            
            return qs


@method_decorator(login_required,name='dispatch')
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


@method_decorator(login_required,name='dispatch')
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


@method_decorator(login_required,name='dispatch')
class DocumentListView(ListView):
    model = Document

    def get_queryset(self):
        qs = super().get_queryset().order_by("data_partner")
        return qs


@method_decorator(login_required,name='dispatch')
class DocumentFileListView(ListView):
    model = DocumentFile

    def get_queryset(self):
        qs = super().get_queryset().order_by("status")
        search_term = self.kwargs.get("pk")
        if search_term is not None:
            qs = qs.filter(document__id=search_term)

        
        return qs


@method_decorator(login_required,name='dispatch')
class DocumentFileFormView(FormView):
    model = DocumentFile
    form_class = DocumentFileForm
    template_name = "mapping/upload_document_file.html"
    # success_url=reverse_lazy('document-list')

    def form_valid(self, form):
        document_file = DocumentFile.objects.create(
            document_file=form.cleaned_data["document_file"],
            size=20,
            document=form.cleaned_data["document"],
            # status="Inactive"
        )

        document_file.save()

        return super().form_valid(form)

    def get_success_url(self, **kwargs):
        self.object = self.kwargs.get("pk")
        return reverse("file-list", kwargs={"pk": self.object})

@method_decorator(login_required,name='dispatch')
class DataDictionaryListView(ListView):
    model = DataDictionary
    ordering = ["-source_value"]

    def get_queryset(self):
        qs = super().get_queryset()
        search_term = self.request.GET.get("search", None)
        if search_term is not None:
            qs = (
                qs.filter(source_value__scan_report_field__scan_report_table__scan_report__id=search_term)
                .filter(source_value__scan_report_field__is_patient_id=False)
                .filter(source_value__scan_report_field__is_date_event=False)
                .filter(source_value__scan_report_field__is_ignore=False)
                .exclude(source_value__value='List truncated...')
            )
        return qs

    def get_context_data(self, **kwargs):

        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)

        if len(self.get_queryset()) > 0:
            scan_report = self.get_queryset()[0].source_value.scan_report_field.scan_report_table.scan_report
        else:
            scan_report = None

        context.update(
            {
                "scan_report": scan_report,
            }
        )

        return context

@method_decorator(login_required,name='dispatch')
class DataDictionaryUpdateView(UpdateView):
    model = DataDictionary
    fields = [
        "dictionary_table",
        "dictionary_field",
        "dictionary_field_description",
        "dictionary_value_code",
        "dictionary_value_description",
        "definition_fixed",
    ]

    def get_success_url(self):
        return "{}?search={}".format(
            reverse("data-dictionary"),
            self.object.source_value.scan_report_field.scan_report_table.scan_report.id,
        )

@method_decorator(login_required,name='dispatch')
class DictionarySelectFormView(FormView):

    form_class = DictionarySelectForm
    template_name = "mapping/mergedictionary.html"
    success_url = reverse_lazy("data-dictionary")

    def form_valid(self, form):

        # Adapt logic in services.py to merge data dictionary file into DataDictionary model

        return super().form_valid(form)


@method_decorator(login_required,name='dispatch')
class DocumentFileStatusUpdateView(UpdateView):
    model = DocumentFile
    # success_url=reverse_lazy('file-list')
    fields = ["status"]

    def get_success_url(self, **kwargs):
     return reverse("file-list", kwargs={'pk': self.object.document_id})


class SignUpView(generic.CreateView):
    form_class = UserCreateForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"


@method_decorator(login_required,name='dispatch')
class CCPasswordChangeView(FormView):
    form_class = PasswordChangeForm
    success_url = reverse_lazy('password_change_done')
    template_name = 'registration/password_change_form.html'
    
    @method_decorator(sensitive_post_parameters())
    @method_decorator(csrf_protect)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        form.save()
        return super().form_valid(form)


@method_decorator(login_required,name='dispatch')
class CCPasswordChangeDoneView(PasswordChangeDoneView):
    template_name = 'registration/password_change_done.html'
    
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
    print('SEARCH TERM >>> ', search_term)

    # Grab the appropriate data dictionary which is built when a scan report is uploaded
    dictionary = DataDictionary.objects.filter(source_value__scan_report_field__scan_report_table__scan_report__id=search_term).filter(source_value__scan_report_field__is_patient_id=False).filter(source_value__scan_report_field__is_date_event=False).filter(source_value__scan_report_field__is_ignore=False).exclude(source_value__value='List truncated...')
    
    # Convert QuerySet to dataframe
    dict_df = pd.DataFrame.from_dict(dictionary.values(
                                            "source_value__scan_report_field__scan_report_table__scan_report__data_partner__name",
                                            "source_value__scan_report_field__scan_report_table__scan_report__dataset",
                                            "source_value__scan_report_field__scan_report_table__name",
                                            "source_value__scan_report_field__name",
                                            "source_value__value",
                                            "source_value__frequency",
                                            "dictionary_field_description",
                                            "dictionary_value_description",
                                            )
                                        )
    
    # Name columns
    dict_df.columns = [
        "DataPartner",
        "DataSet",
        "Table",
        "Field",
        "Value",
        "Frequency",
        "FieldDesc",
        "ValueDescription",
    ]

    #dict_df.to_csv('/data/TEMP_internal_dictionary.csv')

    # There's no direct link in our models between an uploaded Document/File and a ScanReport
    # So, first grab the DataPartner value for the ScanReport ID (i.e. the search term)
    scan_report_data_partner = ScanReport.objects.filter(id=search_term).values('data_partner')
    # scan_report_data_partner = str(ScanReport.objects.filter(id=search_term)[0].data_partner)
    
    # Return only those document files where the data partner matches scan_report_data_partner
    # Filter to return only LIVE data dictionaries
    
    files = DocumentFile.objects.filter(document__data_partner__in=scan_report_data_partner).filter(document__document_type__name="Data Dictionary").filter(status="LIVE").values_list("document_file", flat=True)
    files = list(files)
    
    if len(files)==1:
    
        # Load in uploaded data dictionary for joining (From the Documents section of the webapp)
        external_dictionary = pd.read_csv(os.path.join('media/', files[0]))

        # # Create an intermediate join table
        # # This ensures that each field in scan_report has a field description from the external dictionary
        field_join = pd.merge(dict_df, external_dictionary, how='left', left_on='Field', right_on='Column Name')
        
        field_join_grp = field_join.groupby(['Field', 'Value']).first().reset_index()

        field_join_grp = field_join_grp[['Table', 'Field', 'Value', 'Frequency', 'FieldDesc', 'Column Description']]

        field_join_grp.to_csv('/data/TEMP_field_join_output.csv')

        # Join the intermediate join back to the external dictionary
        # This time on field and value
        x = pd.merge(field_join_grp, external_dictionary, how='left', left_on=['Field', 'Value'], right_on=['Column Name', 'ValueCode'])
        
        x = x[['Table', 'Field', 'Value', 'Frequency', 'FieldDesc', 'Table Name', 'Column Name', 'Column Description_x', 'ValueCode', 'ValueDescription']]
        # x=x.fillna(value="")
        x.columns = [
            "Source_Table",
            "Source_Field",
            "Source_Value",
            "Source_Frequency",
            "Source_FieldDesc",
            "Dictionary_TableName",
            "Dictionary_ColumnName",
            "Dictionary_ColumnDesc",
            "Dictionary_ValueCode",
            "Dictionary_ValueDescription"
        ]

        # If data are missing from imported dictionary
        # replace with analagous descriptions to flesh out dictionary for Usagi
        bad_index = x["Dictionary_ValueDescription"].isnull()
        x["Dictionary_ValueDescription"][bad_index] = x["Dictionary_ValueCode"][bad_index]

        bad_index = x["Source_FieldDesc"].isnull()
        x["Source_FieldDesc"][bad_index] = x["Source_Field"][bad_index]

        for index, row in x.iterrows():
            
            print(row['Source_Field'])
            print(row['Source_Value'])

            obj = DataDictionary.objects.get(
                source_value__scan_report_field__name=row['Source_Field'],
                source_value__value=row['Source_Value']
                )

            print(type(obj))

            # If user has fixed the definition in the webapp
            # don't overwrite the held definition with the external dictionary values
            if obj.definition_fixed:
                continue

            else:
                obj.dictionary_table=row['Dictionary_TableName']
                obj.dictionary_field=row['Dictionary_ColumnName']
                obj.dictionary_field_description=row['Dictionary_ColumnDesc']
                obj.dictionary_value_code=row['Dictionary_ValueCode']
                obj.dictionary_value_description=row['Dictionary_ValueDescription']
                obj.save()
        messages.success(request,"Merge was successful")

    elif len(files)>1:
        messages.warning(request, "There are currently more than 1 data dictionaries set as 'Live'. Please ensure only 1 dictionary is set to 'Live' to proceed.")

    elif len(files)==0:
         messages.warning(request, "There are data dictionaries available for this data partner, but none of them are set to 'Live'. Please set a dictionary to 'Live'.")

    return render(request, "mapping/mergedictionary.html")


   
