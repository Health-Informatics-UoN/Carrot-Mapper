import csv
import tempfile

from django.shortcuts import render
from django.urls import reverse_lazy
from django.views.generic import ListView
from django.views.generic.edit import FormView
from xlsx2csv import Xlsx2csv

from .forms import ScanReportForm
from .models import Mapping, Source, ScanReport, ScanReportField, \
    ScanReportTable


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

        scan_report = ScanReport.objects.create(
            data_partner=form.cleaned_data['data_partner'],
            dataset=form.cleaned_data['dataset'],
            file=form.cleaned_data['scan_report_file']
        )

        scan_report.save()  # Save all form data to model ScanReport

        xlsx = Xlsx2csv(
            form.cleaned_data['scan_report_file'],
            outputencoding="utf-8"
        )

        filepath = "/tmp/{}.csv".format(xlsx.workbook.sheets[0]['name'])
        xlsx.convert(filepath)

        with open(filepath, 'rt') as f:
            reader = csv.reader(f)
            for row in reader:

                if row[0] != '':

                    scan_report_table, has_created = ScanReportTable.objects.get_or_create(
                        scan_report=scan_report,
                        name=row[0],
                    )

                    # print('<<<< {} {}'.format(row[0], has_created))

                    ScanReportField.objects.create(
                        scan_report_table=scan_report_table,
                        name=row[1],
                        description_column=row[2],
                        type_column=row[3],
                        max_length=1,
                        nrows=1,
                        nrows_checked=1,
                        fraction_empty=1,
                        nunique_values=1,
                        fraction_unique=0.5
                    )
                # print(row)

        for idx, sheet in enumerate(xlsx.workbook.sheets):
            try:
                scan_report_table = ScanReportTable.objects.get(
                    scan_report=scan_report,
                    name=sheet['name']
                )
            except ScanReportTable.DoesNotExist:
                continue

            if scan_report_table is None:
                continue

            if idx < 2:
                continue

            filepath = "/tmp/{}".format(sheet['name'])

            xlsx.convert(filepath, sheetid=idx)

            with open(filepath, 'rt') as f:
                reader = csv.reader(f)
                for row in reader:

                    num_columns = len(row)
                    print('>>> num columns: {}'.format(num_columns))

                    for i in range(num_columns):

                        if i % 2 == 0:

                            if not row[i] == '':

                                print('>>> {} {} {}'.format(sheet['name'], row[i], row[i + 1]))

                    # if row[0] != '':
                    #     scan_report_table, _ = ScanReportTable.objects.get_or_create(
                    #         scan_report=scan_report,
                    #         name=row[0],
                    #     )
                    #
                    #     ScanReportField.objects.create(
                    #         scan_report_table=scan_report_table,
                    #         name=row[1],
                    #         description_column=row[2],
                    #         type_column=row[3],
                    #         max_length=1,
                    #         nrows=1,
                    #         nrows_checked=1,
                    #         fraction_empty=1,
                    #         nunique_values=1,
                    #         fraction_unique=0.5
                    #     )
                    # print(row)

            print(sheet['name'])

        # for sheet in xlsx.workbook.sheets:

        # Presumably I'll need to iterate row-wise over field_overview to save this into the model ScanReportFieldOverviewRecord?

        return super().form_valid(form)
