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


# We probably need to deprecate this function
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
            file=form.cleaned_data['scan_report_file'] # Does this save the entire file to the database (as a legit .xlsx file)?
        )

        scan_report.save()  # Save all form data to model ScanReport

        xlsx = Xlsx2csv(
            form.cleaned_data['scan_report_file'],
            outputencoding="utf-8"
        )

        # Path to 1st sheet in scan report (i.e. Field Overview sheet), convert to CSV
        filepath = "/tmp/{}.csv".format(xlsx.workbook.sheets[0]['name'])
        xlsx.convert(filepath)

        with open(filepath, 'rt') as f:
            reader = csv.reader(f)
            next(reader) # Skip header row

            # For each row in the Field Overview sheet
            for row in reader:
                # If the value in the first column (i.e. the Table col) is not blank;
                # Save the table name as a new entry in the model ScanReportTable
                if row[0] != '':
                    scan_report_table, _ = ScanReportTable.objects.get_or_create(
                        scan_report=scan_report, # This links ScanReportTable to ScanReport
                        name=row[0],
                    )

                    # Add each row of data for the Table to the model ScanReportField
                    ScanReportField.objects.create(
                        scan_report_table=scan_report_table, # This links ScanReportField to its parent in ScanReportTable
                        name=row[1],
                        description_column=row[2],
                        type_column=row[3],
                        max_length=row[4],
                        nrows=row[5],
                        nrows_checked=row[6],
                        fraction_empty=row[7],
                        nunique_values=row[8],
                        fraction_unique=row[9]
                    )

        # For sheets past the first two in the scan Report
        # i.e. all 'data' sheets that are not Field Overview and Table Overview
        for sheet in xlsx.workbook.sheets[2:]:

            # GET table name from ScanReportTable that was saved in the previous step when scanning the Field Overview sheet
            scan_report_table = ScanReportTable.objects.get(
                scan_report=scan_report,
                name=sheet['name'] # 'name' here refers to the field name in ScanReportTable
            )

            if scan_report_table is None:
                continue

            filepath = "/tmp/{}".format(sheet['name']) # Get the filepath to the converted CSV files

            with open(filepath, 'rt') as f:
                reader = csv.DictReader(f)
                for row in reader:

                    num_columns = len(row)

                    for i in range(num_columns/2):
                        print('{} {} {}'.format(sheet['name'], row[i * 2], row[i * 2 + 1]))

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
