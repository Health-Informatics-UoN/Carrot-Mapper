import csv
from xlsx2csv import Xlsx2csv
import subprocess
import sys
import os
import pandas as pd

from .models import ScanReport, ScanReportTable, ScanReportField, \
    ScanReportValue, DataDictionary


def process_scan_report_sheet_table(filename):
    """
    This function converts a White Rabbit scan report to CSV and extract the
    data into the format below.

    -- Example Table Sheet CSV --
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

        # reader = csv.reader(f)

        # == Comment - Calum 4/2/2020
        # * This is a fix for the following error..
        #    _csv.Error: line contains NUL
        # * It's coming from hidden ^O or ^M  / NULL bytes in the excell/csv
        # * Temp fix may slow down the code a lot for large files
        # * Using pandas would deal with these type of things

        reader = csv.reader(x.replace('\0', '') for x in f)


        for row_idx, row in enumerate(reader):

            if row_idx == 0:
                column_names = row

                continue

            # Works through pairs of value/frequency columns
            for col_idx, col in enumerate(row):

                if col_idx % 2 == 0:

                    # As we move down rows, checks that there's data there
                    # This is required b/c value/frequency col pairs differ
                    # in the number of rows
                    if row[col_idx] == '' and row[col_idx + 1] == '':
                        continue

                    result.append((column_names[col_idx], row[col_idx], row[col_idx + 1]))

    return result


def process_scan_report(scan_report_id):
    scan_report = ScanReport.objects.get(pk=scan_report_id)

    xlsx = Xlsx2csv(
        scan_report.file,
        outputencoding="utf-8"
    )

    # Path to 1st sheet in scan report (i.e. Field Overview) convert to CSV
    filepath = "/tmp/{}.csv".format(xlsx.workbook.sheets[0]['name'])
    xlsx.convert(filepath)

    with open(filepath, 'rt') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header row

        # For each row in the Field Overview sheet
        # Saves an entry in ScanReportField for each Field in a Scan Report
        for row in reader:

            # If the value in the first column (i.e. the Table Col) is not blank;
            # Save the table name as a new entry in the model ScanReportTable
            # Checks for blank b/c White Rabbit seperates tables with blank row
            if row and row[0] != '':
                # This links ScanReportTable to ScanReport
                # [:31] is because excel is a pile of s***
                # - sheet names are truncated to 31 characters
                name = row[0][:31]

                scan_report_table, _ = ScanReportTable.objects.get_or_create(
                    scan_report=scan_report,
                    name=name,
                )

                # Add each field in Field Overview to the model ScanReportField
                ScanReportField.objects.create(
                    scan_report_table=scan_report_table,
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

        # skip these sheets at the end of the scan report
        if sheet['name'] == '_':
            continue


        # GET table name from ScanReportTable that was saved in the previous
        # step when scanning the Field Overview sheet

        print('>>>> {}'.format(sheet['name']))

        try:
            scan_report_table = ScanReportTable.objects.get(
                scan_report=scan_report,
                name=sheet['name']
                # 'name' here refers to the field name in ScanReportTable
            )
        except ScanReportTable.DoesNotExist:
            continue

        # Get the filepath to the converted CSV files
        filename = "/tmp/{}".format(sheet['name'])
        xlsx.convert(filename, sheetid=idxsheet + 1)

        results = process_scan_report_sheet_table(filename)

        # For each row in a data sheet:
        for result in results:

            # Grab the Scan Report Field
            scan_report_field = ScanReportField.objects.get(
                scan_report_table=scan_report_table,
                scan_report_table__scan_report=scan_report,
                name=result[0],
            )

            # Save each row of values/frequencies to the model ScanReportValue
            # This can take some time if the scan report is large

            if result[2] == '':
                frequency = 0
            else:
                frequency = result[2]

            ScanReportValue.objects.create(
                scan_report_field=scan_report_field,
                value=result[1][:127],
                frequency=frequency,
            )

            DataDictionary.objects.create(
                source_value=ScanReportValue.objects.latest('id'),
                definition_fixed=False,
            )


# def import_data_dictionary(filepath):
#     filepath = filepath

#     with open(filepath, 'rt') as f:
#         reader = csv.reader(f)
#         next(reader)  # Skip header row

#         # Assumes that the input columns are in the same order as the Twins data dictionary
#         for row in reader:

#             if row[0][0] == '':
#                 continue

#             print(row)
            
#             DataDictionary.objects.create(
#                 dictionry_table=row[0],
#                 dictionary_field=row[1],
#                 dictionry_field_description=row[2],
#                 dictionary_value_code=row[3],
#                 dictionry_value_description=row[4]
#             )


def build_usagi_index():
    # Use 'build' to create index for the first time.
    # Index stored in data/usagi/mainIndex
    p = subprocess.Popen('java -jar Usagi.jar build usagi_build_index.properties', cwd="/data/usagi", shell=True,
                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    # Print console output to screen so you can see it's working (or not!)
    stdout = []
    while True:
        line = p.stdout.readline()
        if not isinstance(line, (str)):
            line = line.decode('utf-8')
        stdout.append(line)
        print(line)
        if (line == '' and p.poll() != None):
            break

def run_usagi(scan_report_id):

    print('RUNNING USAGI....')

    # Grab data from DataDictionary
    dict = DataDictionary.objects.filter(source_value__scan_report_field__scan_report_table__scan_report__id=scan_report_id)
    dict_df = pd.DataFrame.from_dict(dict.values('source_value__scan_report_field__scan_report_table__scan_report__data_partner__name',
                                                'source_value__scan_report_field__scan_report_table__scan_report__dataset',
                                                'source_value__scan_report_field__scan_report_table__name',
                                                'source_value__scan_report_field__name',
                                                'source_value__value', 
                                                'source_value__frequency',
                                                'dictionary_field_description',
                                                'dictionary_value_description',
                                                'source_value__scan_report_field__is_patient_id',
                                                'source_value__scan_report_field__is_date_event',
                                                'source_value__scan_report_field__is_ignore'))

    # Name columns
    dict_df.columns = ['DataPartner', 'DataSet', 'Table', 'Field', 'Value', 'Frequency', 'FieldDesc', 'ValueDescription', 'PatientID', 'IsDate', 'IsIgnore']

    # Filter out any values (rows) where the parent field has been set to PatientID/Date/Ignore when mapping
    # Also removes all values which are blank/N/No/0 etc as these terms aren't mapped
    df = dict_df.loc[((dict_df['PatientID'] != True) & 
                        (dict_df['IsDate'] != True) & 
                        (dict_df['IsIgnore'] != True) & 
                        (dict_df['Value'] != '') & 
                        (dict_df['Value'] != 'N') &
                        (dict_df['Value'] != 'No') &
                        (dict_df['Value'] != '0'))]

    df = df.drop(columns=['PatientID', 'IsDate', 'IsIgnore'])

    bad_index = df['ValueDescription'].isnull()
    df['ValueDescription'][bad_index] = df['Value'][bad_index]

    bad_index = df['FieldDesc'].isnull()
    df['FieldDesc'][bad_index] = df['Field'][bad_index]

    df = df.head(10)
    df.to_csv('/data/usagi/input/usagi_input_data.csv', index=False)
    
    # # Run Usagi
    p = subprocess.Popen('java -jar dist/Usagi.jar run input/usagi.properties', cwd="/data/usagi", shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    stdout = []
    while True:
        line = p.stdout.readline()
        if not isinstance(line, (str)):
            line = line.decode('utf-8')
        stdout.append(line)
        print(line)
        if (line == '' and p.poll() != None):
            break

    # Clean up inputs
    # os.remove('/data/usagi/usagi_input/usagi_input_data.csv')
    # os.remove('/data/usagi/usagi_input/usagi.properties')

    print('USAGI FINISHED!')
