import csv
import tempfile

from django.shortcuts import render
from django.urls import reverse_lazy
from django.views.generic import ListView
from django.views.generic.edit import FormView
from xlsx2csv import Xlsx2csv
from django.views import generic
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm


from .forms import ScanReportForm
from .models import Mapping, Source, ScanReport, ScanReportField, \
    ScanReportTable


# We probably need to deprecate this function
from .services import process_scan_report
from .tasks import process_scan_report_task


@login_required
def index(request):

    # Pull in all entries in each database (model)
    mapping = Mapping.objects.all()
    source = Source.objects.all()

    # Create quick context dict
    context = {
        'source': source,
        'mapping': mapping,
    }

    return render(request, 'mapping/index.html', context)


class ScanReportTableListView(ListView):
    model = ScanReportTable

    def get_queryset(self):
        qs = super().get_queryset().order_by('name')
        search_term = self.request.GET.get('search', None)
        if search_term is not None:
            qs = qs.filter(scan_report__id=search_term)
        return qs


class ScanReportFieldListView(ListView):
    model = ScanReportField

    def get_queryset(self):
        qs = super().get_queryset().order_by('name')
        search_term = self.request.GET.get('search', None)
        if search_term is not None:
            qs = qs.filter(scan_report_table__id=search_term)
        return qs


class ScanReportListView(ListView):
    model = ScanReport


class ScanReportFormView(FormView):  # When is it best to use FormView?

    form_class = ScanReportForm
    template_name = 'mapping/upload_scan_report.html'
    success_url = reverse_lazy('scan-report-list')

    def form_valid(self, form):

        # Create an entry in ScanReport for the uploaded Scan Report
        scan_report = ScanReport.objects.create(
            data_partner=form.cleaned_data['data_partner'],
            dataset=form.cleaned_data['dataset'],
            file=form.cleaned_data['scan_report_file']
            # Does this save the entire file to the database (as a legit .xlsx file)?
        )

        # Save all form data to model ScanReport
        scan_report.save()

        process_scan_report_task.delay(scan_report.id)

        return super().form_valid(form)

class SignUpView(generic.CreateView):
    form_class = UserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'registration/signup.html'
