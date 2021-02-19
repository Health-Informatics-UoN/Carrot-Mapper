from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordResetForm, PasswordChangeForm
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.views import PasswordChangeView, PasswordChangeDoneView
from django.core.mail import send_mail, BadHeaderError
from django.db.models.query_utils import Q
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.urls import reverse
from django.urls import reverse_lazy
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.views import generic
from django.views.generic import ListView
from django.views.generic.edit import FormView, UpdateView, DeleteView, \
    CreateView
from extra_views import ModelFormSetView

from .forms import ScanReportForm, UserCreateForm, AddMappingRuleForm, \
    DocumentForm,DocumentFileForm, DictionarySelectForm
from .models import ScanReport, ScanReportValue, ScanReportField, \
    ScanReportTable, MappingRule, OmopTable, OmopField, DocumentFile, Document, DataDictionary
from .tasks import process_scan_report_task, import_data_dictionary_task, run_usagi_task

from .services import process_scan_report, run_usagi
from .tasks import process_scan_report_task, run_usagi


@login_required
def home(request):
    return render(request, 'mapping/home.html', {})


class ScanReportTableListView(ListView):
    model = ScanReportTable

    def get_queryset(self):
        qs = super().get_queryset()
        search_term = self.request.GET.get('search', None)
        if search_term is not None and search_term is not '':
            qs = qs.filter(scan_report__id=search_term)

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

        context.update({
            'scan_report': scan_report,
            'scan_report_table': scan_report_table,
        })

        return context


class ScanReportFieldListView(ListView):
    model = ScanReportField

    def get_queryset(self):
        qs = super().get_queryset()
        search_term = self.request.GET.get('search', None)
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

        context.update({
            'scan_report': scan_report,
            'scan_report_table': scan_report_table,
            'scan_report_field': scan_report_field,
        })

        return context


class ScanReportFieldUpdateView(UpdateView):
    model = ScanReportField
    fields = [
        'is_patient_id',
        'is_date_event',
        'is_ignore',
        'classification_system',
    ]

    def get_success_url(self):
        return "{}?search={}".format(reverse('fields'), self.object.scan_report_table.id)



class ScanReportStructuralMappingUpdateView(UpdateView):
    model = ScanReportField
    fields = [
        'mapping'
    ]

    def get_success_url(self):
        return "{}?search={}".format(reverse('fields'), self.object.scan_report_table.id)


class ScanReportListView(ListView):
    model = ScanReport


class ScanReportValueListView(ModelFormSetView):
    model = ScanReportValue
    fields = ['value','frequency','conceptID']
    fields = ['conceptID']
    factory_kwargs = {'can_delete': False, 'extra': False}

    def get_queryset(self):
         qs = super().get_queryset()
         search_term = self.request.GET.get('search', None)
         if search_term is not None:
             qs = qs.filter(scan_report_field=search_term)
         return qs

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)

        if len(self.get_queryset()) > 0:
            #scan_report = self.get_queryset()[0].scan_report_table.scan_report
            #scan_report_table = self.get_queryset()[0].scan_report_table
            scan_report = self.get_queryset()[0].scan_report_field.scan_report_table.scan_report
            scan_report_table = self.get_queryset()[0].scan_report_field.scan_report_table
            scan_report_field = self.get_queryset()[0].scan_report_field
            scan_report_value = self.get_queryset()[0]
        else:
            scan_report = None
            scan_report_table = None
            scan_report_field = None
            scan_report_value = None

        context.update({
            'scan_report': scan_report,
            'scan_report_table': scan_report_table,
            'scan_report_field': scan_report_field,
            'scan_report_value': scan_report_value,
        })

        return context


class AddMappingRuleFormView(FormView):
    form_class = AddMappingRuleForm
    template_name = 'mapping/mappingrule_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        scan_report_field = ScanReportField.objects.get(
            pk=self.kwargs.get('pk')
        )

        scan_report = scan_report_field.scan_report_table.scan_report
        scan_report_table = scan_report_field.scan_report_table
        scan_report_field = scan_report_field

        context.update({
            'scan_report': scan_report,
            'scan_report_table': scan_report_table,
            'scan_report_field': scan_report_field,
        })

        return context

    def form_valid(self, form):

        scan_report_field = ScanReportField.objects.get(
            pk=self.kwargs.get('pk')
        )

        mapping = MappingRule.objects.create(
            omop_field=form.cleaned_data['omop_field'],
            scan_report_field=scan_report_field
        )

        mapping.save()

        return super().form_valid(form)

    def get_success_url(self):
        scan_report_field = ScanReportField.objects.get(
            pk=self.kwargs.get('pk')
        )

        return "{}?search={}".format(reverse('fields'), scan_report_field.scan_report_table.id)


class StructuralMappingDeleteView(DeleteView):
    model = MappingRule

    def get_success_url(self):
        scan_report_field = ScanReportField.objects.get(
            pk=self.kwargs.get('pk')
        )

        return "{}?search={}".format(reverse('fields'), scan_report_field.scan_report_table.id)

    success_url = reverse_lazy('fields')


class StructuralMappingListView(ListView):
    model = MappingRule

    def get_queryset(self):
         qs = super().get_queryset()
         search_term = self.kwargs.get('pk')
         if search_term is not None:
             qs = qs.filter(scan_report_field=search_term)
         return qs

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)

        if len(self.get_queryset()) > 0:
            scan_report = self.get_queryset()[0].scan_report_field.scan_report_table.scan_report
            scan_report_table = self.get_queryset()[0].scan_report_field.scan_report_table
            scan_report_field = self.get_queryset()[0]
        else:
            scan_report = None
            scan_report_table = None
            scan_report_field = None

        context.update({
            'scan_report': scan_report,
            'scan_report_table': scan_report_table,
            'scan_report_field': scan_report_field,
        })

        return context


class StructuralMappingTableListView(ListView):
    # model = MappingRule
    model = ScanReportField
    template_name = "mapping/mappingrulesscanreport_list.html"

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)

        scan_report = ScanReport.objects.get(pk=self.kwargs.get('pk'))

        context.update({
            'scan_report': scan_report,
        })

        return context

    def get_queryset(self):
        scan_report = ScanReport.objects.get(pk=self.kwargs.get('pk'))

        mappingrule_list = MappingRule.objects.filter(scan_report_field__scan_report_table__scan_report=scan_report)
        mappingrule_id_list = [mr.scan_report_field.id for mr in mappingrule_list]

        qs = super().get_queryset()
        search_term = self.kwargs.get('pk')
        if search_term is not None:
            # qs = qs.filter(scan_report_table__scan_report__id=search_term)
            qs = qs.filter(id__in=mappingrule_id_list)
            return qs


class ScanReportFormView(FormView):
    form_class = ScanReportForm
    template_name = 'mapping/upload_scan_report.html'
    success_url = reverse_lazy('scan-report-list')

    def form_valid(self, form):
        # Create an entry in ScanReport for the uploaded Scan Report
        scan_report = ScanReport.objects.create(
            data_partner=form.cleaned_data['data_partner'],
            dataset=form.cleaned_data['dataset'],
            file=form.cleaned_data['scan_report_file'],
        )
        scan_report.author = self.request.user

        scan_report.save()

        process_scan_report_task.delay(scan_report.id)

        return super().form_valid(form)


class DocumentFormView(FormView):
    form_class = DocumentForm
    template_name = 'mapping/upload_document.html'
    success_url = reverse_lazy('document-list')

    def form_valid(self, form):
        document = Document.objects.create(
            data_partner=form.cleaned_data['data_partner'],
            document_type=form.cleaned_data['document_type'],
            description=form.cleaned_data['description'],

        )
        document.owner = self.request.user

        document.save()
        document_file=DocumentFile.objects.create(
            document_file=form.cleaned_data['document_file'],
            size=20,
            document=document
        )
        document_file.save()

        # This code will be required later to import a data dictionary into the DataDictionary model
        # filepath = document_file.document_file.path
        # import_data_dictionary_task.delay(filepath)

        return super().form_valid(form)


class DocumentListView(ListView):
    model = Document

    def get_queryset(self):
        qs = super().get_queryset().order_by('data_partner')
        return qs


class DocumentFileListView(ListView):
    model = DocumentFile

    def get_queryset(self):
         qs = super().get_queryset().order_by('status')
         search_term = self.kwargs.get('pk')
         if search_term is not None:
             qs = qs.filter(document__id=search_term)
         return qs


class DocumentFileFormView(FormView):
    model=DocumentFile
    form_class = DocumentFileForm
    template_name = 'mapping/upload_document_file.html'
    # success_url=reverse_lazy('document-list')
    
    def form_valid(self, form):
        document_file=DocumentFile.objects.create(
            document_file=form.cleaned_data['document_file'],
            size=20,
            document=form.cleaned_data['document'],
            # status="Inactive"
        )

        document_file.save()
    
        return super().form_valid(form)

    def get_success_url(self, **kwargs):
     self.object=self.kwargs.get('pk')
     return reverse("file-list", kwargs={'pk': self.object})

    
class DataDictionaryListView(ListView):
        model = DataDictionary
        paginate_by = 10
        ordering = ['-dictionary_table']

        def get_queryset(self):
            qs = super().get_queryset()
            search_term = self.request.GET.get('search', None)
            if search_term is not None:
                qs = qs.filter(source_value__scan_report_field__scan_report_table__scan_report__id=search_term)
            return qs

        def get_context_data(self, **kwargs):

            # Call the base implementation first to get a context
            context = super().get_context_data(**kwargs)

            if len(self.get_queryset()) > 0:
                scan_report = self.get_queryset()[0].source_value.scan_report_field.scan_report_table.scan_report
            else:
                scan_report = None

            context.update({
                'scan_report': scan_report,
            })

            return context

class DataDictionaryUpdateView(UpdateView):
    model = DataDictionary
    fields = [
        'dictionary_table',
        'dictionary_field',
        'dictionary_field_description',
        'dictionary_value_code',
        'dictionary_value_description',
        'definition_fixed',
    ]

    def get_success_url(self):
        return "{}?search={}".format(reverse('data-dictionary'), self.object.source_value.scan_report_field.scan_report_table.scan_report.id)


class DictionarySelectFormView(FormView):

    form_class = DictionarySelectForm
    template_name = 'mapping/mergedictionary.html'
    success_url = reverse_lazy('data-dictionary')

    def form_valid(self, form):
        
        # Adapt logic in services.py to merge data dictionary file into DataDictionary model

        return super().form_valid(form)


class DocumentFileStatusUpdateView(UpdateView):
    model = DocumentFile
    # success_url=reverse_lazy('file-list')
    fields = [
        'status'
    ]

    def get_success_url(self, **kwargs):
    # obj = form.instance or self.object
     return reverse("file-list", kwargs={'pk': self.object.document_id})


class SignUpView(generic.CreateView):
    form_class = UserCreateForm
    success_url = reverse_lazy('login')
    template_name = 'registration/signup.html'


class CCPasswordChangeView(PasswordChangeView):
    pass


class CCPasswordChangeDoneView(PasswordChangeDoneView):
    pass


def password_reset_request(request):
    if request.method == "POST":
        password_reset_form = PasswordResetForm(request.POST)
        if password_reset_form.is_valid():
            data = password_reset_form.cleaned_data['email']
            associated_users = User.objects.filter(Q(email=data))
            if associated_users.exists():
                for user in associated_users:
                    subject = "Password Reset Requested"
                    email_template_name = "/registration/password_reset_email.txt"
                    c = {
                        "email": user.email,
                        'domain': '0.0.0.0:8000',
                        'site_name': 'Website',
                        "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                        "user": user,
                        'token': default_token_generator.make_token(user),
                        'protocol': 'http',
                    }
                    email = render_to_string(email_template_name, c)
                    try:
                        send_mail(subject, email, 'admin@example.com',
                                  [user.email], fail_silently=False)
                    except BadHeaderError:
                        return HttpResponse('Invalid header found.')
                    return redirect("/password_reset_done/")
    password_reset_form = PasswordResetForm()
    return render(request=request,
                  template_name="/registration/password_reset.html",
                  context={"password_reset_form": password_reset_form})


def load_omop_fields(request):
    omop_table_id = request.GET.get('omop_table')
    omop_fields = OmopField.objects.filter(table_id=omop_table_id).order_by('field')
    return render(request, 'mapping/omop_table_dropdown_list_options.html', {'omop_fields': omop_fields})


def testusagi(request, scan_report_id):

    results = run_usagi(scan_report_id)
    print(results)
    context = {}

    return render(request, 'mapping/index.html', context)