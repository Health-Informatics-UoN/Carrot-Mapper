import csv
import tempfile

from django.shortcuts import render
from django.urls import reverse_lazy
from django.views.generic import ListView
from django.views.generic.edit import FormView
from xlsx2csv import Xlsx2csv
from django.contrib.auth.decorators import login_required

from .forms import ScanReportForm
from .models import Mapping, Source, ScanReport, ScanReportField, \
    ScanReportTable


# We probably need to deprecate this function
from .services import process_scan_report


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

        process_scan_report(form)

        return super().form_valid(form)
