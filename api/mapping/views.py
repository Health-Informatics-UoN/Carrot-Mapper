from django.shortcuts import render
from django.urls import reverse_lazy
from django.views.generic import ListView
from django.views.generic.edit import FormView

from .forms import ScanReportForm
from .models import Mapping, Source, ScanReport, ScanReportFieldOverviewRecord
import pandas as pd
import os

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


class ScanReportFormView(FormView): # When is it best to use FormView?

    form_class = ScanReportForm
    template_name = 'mapping/upload_scan_report.html'
    success_url = reverse_lazy('scan-report-list')

    def form_valid(self, form):

        scan_report = ScanReport.objects.create(
            # This concats the data partner and dataset name fields in the
            # ScanReportFormView into 'name' to save into the model: ScanReport$name
            # Why are we concatting fields? Can't we have the required fields in the model?
            name = '{}, {}'.format(
                form.cleaned_data['data_partner'],
                form.cleaned_data['dataset'],
            ),

            # Need some clarity here - do we want to save the whole .xlsx scan report 'as-in' in the database?
            # Also save the user uploaded Scan Report to the model ScanReport
            # Not sure if this has saved b/c you can't view the data from Django Admin
            # The file name appears in the correct field but errors on click
            # I think this code is merely passing the file name string into the file field...
            file = form.cleaned_data['scan_report_file']

        )

        scan_report.save() # Save all form data to model ScanReport
        print(form.cleaned_data) # Print the form's dictionary for dev/debugging


        # TODO Process form and parse scan report.

        # Load in the Field Overview data
        field_data = pd.read_excel(form.cleaned_data['scan_report_file'], sheet_name='Field Overview', engine='openpyxl', na_filter=True)
        field_data = field_data.head() # Only pick out the top 5 rows for testing

        # Define Field Overview sheet column types (matches field type in ScanReport)
        # This just makes sure that read_excel doesn't do any weird parsing of data types when we load in the data
        convert_dict = {
                'Table': str,
                'Field': str,
                'Description': str,
                'Type': str,
                'Max length': int,
                'N rows': int,
                'N rows checked': int,
                'Fraction empty': float,
                'N unique values': int,
                'Fraction unique': float
               }

        field_data = field_data.astype(convert_dict)

        print(field_data)


        # field_overview = ScanReportFieldOverviewRecord.objects.create(
        #         scan_report = I don't know how to link field_data with the user's text input from the form (which ultimately saves to the ScanReport model)
        #         table = field_data['Table'],
        #         field = field_data['Field'],
        #         description_column = field_data['Description'],
        #         type_column = field_data['Type'],
        #         max_length = field_data['Max length'],
        #         nrows = field_data['N rows'],
        #         nrows_checked = field_data['N rows checked'],
        #         fraction_empty = field_data['Fraction empty'],
        #         nunique_values = field_data['N unique values'],
        #         fraction_unique = field_data['Fraction unique'],
        # )
        #

        # Presumably I'll need to iterate row-wise over field_overview to save this into the model ScanReportFieldOverviewRecord?

        return super().form_valid(form)
