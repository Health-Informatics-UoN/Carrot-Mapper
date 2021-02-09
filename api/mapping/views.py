from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
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
from django.views.generic.edit import FormView, UpdateView, DeleteView, CreateView

from .forms import ScanReportForm, UserCreateForm, AddMappingRuleForm
from .models import ScanReport, ScanReportValue, ScanReportField, \
    ScanReportTable, MappingRule, OmopTable, OmopField
from .tasks import process_scan_report_task


@login_required
def home(request):

    return render(request, 'mapping/home.html', {})


class ScanReportTableListView(ListView):
    model = ScanReportTable

    def get_queryset(self):
        qs = super().get_queryset().order_by('name')
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
        qs = super().get_queryset().order_by('name')
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

class ScanReportListView(ListView):
    model = ScanReport

class ScanReportValueListView(ListView):
    model = ScanReportValue
    def get_queryset(self):
         qs = super().get_queryset().order_by('scan_report_field__id')
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
         qs = super().get_queryset().order_by('scan_report_field__id')
         search_term = self.kwargs.get('pk')
         print('SEARCH TERM >>>>> ', search_term)
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


class SignUpView(generic.CreateView):
    form_class = UserCreateForm
    success_url = reverse_lazy('login')
    template_name = 'registration/signup.html'


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
