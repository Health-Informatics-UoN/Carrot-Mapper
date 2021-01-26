from django.shortcuts import render
from django.urls import reverse_lazy
from django.views.generic import ListView
from django.views.generic.edit import FormView

from .forms import ScanReportForm
from .models import Mapping, Source, ScanReport


def index(request):

    # Pull in all entries in each database (model)
    mapping = Mapping.objects.all()
    source = Source.objects.all()

    # Create quick context dict
    context = {
        'source':source,
        'mapping':mapping,
    }

    return render(request, 'mapping/index.html', context)


class ScanReportListView(ListView):
    model = ScanReport


class ScanReportFormView(FormView):
    form_class = ScanReportForm
    template_name = 'mapping/upload_scan_report.html'
    success_url = reverse_lazy('scan-report-list')

    def form_valid(self, form):
        scan_report = ScanReport.objects.create(
            name='{}, {}'.format(
                form.cleaned_data['data_partner'],
                form.cleaned_data['dataset'],
            )
        )
        scan_report.save()

        # TODO Process form and parse scan report.
        print(form.cleaned_data['scan_report_file'])

        return super().form_valid(form)
