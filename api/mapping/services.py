import csv

from xlsx2csv import Xlsx2csv

from .models import ScanReport, ScanReportTable, ScanReportField, \
    ScanReportValue


def process_scan_report_sheet_table(filename):
    """
    This function reads a csv file representing a scan report table sheet,
    and extract the data in the format below.

    -- table sheet csv --
    column a,frequency,column c,frequency
    apple,20,orange,5
    banana,3,plantain,50
    ,,pinable,6
    --

    -- output --
    column a, apple, 20
    column c, orange, 5
    column a, banana, 3
    column c, plantain, 50
    --

    :param filename:
    :return:
    """

    result = []

    with open(filename, "rt") as f:

        column_names = []

        reader = csv.reader(f)

        for row_idx, row in enumerate(reader):

            if row_idx == 0:

                column_names = row

                continue

            for col_idx, col in enumerate(row):

                if col_idx % 2 == 0:

                    if row[col_idx] == '' and row[col_idx + 1] == '':

                        continue

                    result.append((column_names[col_idx], row[col_idx], row[col_idx + 1]))

    return result


def process_scan_report(form):

    scan_report = ScanReport.objects.create(
        data_partner=form.cleaned_data['data_partner'],
        dataset=form.cleaned_data['dataset'],
        file=form.cleaned_data['scan_report_file']
        # Does this save the entire file to the database (as a legit .xlsx file)?
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
        next(reader)  # Skip header row

        # For each row in the Field Overview sheet
        for row in reader:
            # If the value in the first column (i.e. the Table col) is not blank;
            # Save the table name as a new entry in the model ScanReportTable
            if row[0] != '':
                scan_report_table, _ = ScanReportTable.objects.get_or_create(
                    scan_report=scan_report,
                    # This links ScanReportTable to ScanReport
                    name=row[0],
                )

                # Add each row of data for the Table to the model ScanReportField
                ScanReportField.objects.create(
                    scan_report_table=scan_report_table,
                    # This links ScanReportField to its parent in ScanReportTable
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
    for idxsheet, sheet in enumerate(xlsx.workbook.sheets):

        if idxsheet < 2:
            continue

        # GET table name from ScanReportTable that was saved in the previous step when scanning the Field Overview sheet
        scan_report_table = ScanReportTable.objects.get(
            scan_report=scan_report,
            name=sheet['name']
            # 'name' here refers to the field name in ScanReportTable
        )

        if scan_report_table is None:
            continue

        # Get the filepath to the converted CSV files
        filename = "/tmp/{}".format(sheet['name'])
        xlsx.convert(filename, sheetid=idxsheet+1)

        results = process_scan_report_sheet_table(filename)

        for result in results:

            scan_report_field = ScanReportField.object.get(
                name=result[0],
                scan_report_table=scan_report_table,
                scan_report_table__scan_report=scan_report,
            )

            ScanReportValue.objects.create(
                scan_report_field=scan_report_field,
                value=result[1],
                frequency=result[2],
            )

    # for sheet in xlsx.workbook.sheets:

    # Presumably I'll need to iterate row-wise over field_overview to save this into the model ScanReportFieldOverviewRecord?
