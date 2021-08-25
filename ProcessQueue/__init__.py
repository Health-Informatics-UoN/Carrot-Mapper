import logging
import json
import ast
import azure.functions as func
from azure.storage.blob import BlobServiceClient
from io import BytesIO
import requests
import openpyxl
from datetime import datetime
import os
import csv

from shared_code import omop_helpers

# Agreed vocabs that are accepted for lookup/conversion
# The Data Team decide what vocabs are accepted.
# Add more as necessary by appending the list
vocabs = [
    "ABMS",
    "ATC",
    "HCPCS",
    "HES Specialty",
    "ICD10",
    "ICD10CM",
    "ICD10PCS",
    "ICD9CM",
    "ICD9Proc",
    "LOINC",
    "NDC",
    "NUCC",
    "OMOP Extension",
    "OSM",
    "PHDSC",
    "Read",
    "RxNorm",
    "RxNorm Extension",
    "SNOMED",
    "SPL",
    "UCUM",
    "UK Biobank",
]


def process_scan_report_sheet_table(sheet):
    """
    This function extracts the
    data into the format below.

    -- Example Table Sheet CSV --
    column a,frequency,column c,frequency
    apple,      20,     orange,      5
    banana,     3,      plantain,    50

    --

    -- output --
    column a, apple, 20
    column c, orange, 5
    column a, banana, 3
    column c, plantain, 50
    --
    """
    results = []
    # Get max number of columns in the sheet
    max_column = sheet.max_column
    # Skip headers, set min_row & row_idx=2
    for row_idx, row_cell in enumerate(
        sheet.iter_rows(min_row=2, max_col=max_column), start=2
    ):

        # Works through pairs of value/frequency columns
        for column_idx, cell in enumerate(row_cell, start=1):
            if (column_idx) % 2 == 1:

                column_name = sheet.cell(row=1, column=column_idx).value
                value = sheet.cell(row=row_idx, column=column_idx).value
                frequency = sheet.cell(row=row_idx, column=column_idx + 1).value

                # As we move down rows, checks that there's data there
                # This is required b/c value/frequency col pairs differ
                # in the number of rows
                if (value == "" or value is None) and (
                    frequency == "" or frequency is None
                ):
                    continue

                # Append to Results as (Field Name,Value,Frequency)
                results.append(
                    (
                        str(column_name),
                        str(value),
                        frequency,
                    )
                )
    return results


def main(msg: func.QueueMessage):
    logging.info("Python queue trigger function processed a queue item.")

    # Set up ccom API parameters:
    api_url = os.environ.get("APP_URL") + "api/"
    headers = {
        "Content-type": "application/json",
        "charset": "utf-8",
        "Authorization": "Token {}".format(os.environ.get("AZ_FUNCTION_KEY")),
    }

    # Set Storage Account connection string
    blob_service_client = BlobServiceClient.from_connection_string(
        os.environ.get("STORAGE_CONN_STRING")
    )

    # Get message from queue
    message = json.dumps(
        {
            "id": msg.id,
            "body": msg.get_body().decode("utf-8"),
            "expiration_time": (
                msg.expiration_time.isoformat() if msg.expiration_time else None
            ),
            "insertion_time": (
                msg.insertion_time.isoformat() if msg.insertion_time else None
            ),
            "time_next_visible": (
                msg.time_next_visible.isoformat() if msg.time_next_visible else None
            ),
            "pop_receipt": msg.pop_receipt,
            "dequeue_count": msg.dequeue_count,
        }
    )

    # Grab message body from storage queues,
    # extract filenames for scan reports and dictionaries
    message = json.loads(message)
    body = ast.literal_eval(message["body"])
    scan_report_blob = body["scan_report_blob"]
    data_dictionary_blob = body["data_dictionary_blob"]

    print("MESSAGE BODY >>>", body)

    # If the message has been dequeued for a second time, then the upload has failed.
    # Patch the name of the dataset to make it clear tht it has failed, and then stop.
    print("dequeue_count", msg.dequeue_count)
    if msg.dequeue_count > 1:
        scan_report_fetched_data = requests.get(
            url=f"{api_url}scanreports/{body['scan_report_id']}/",
            headers=headers,
        )

        scan_report_fetched_data = json.loads(scan_report_fetched_data.content.decode("utf-8"))

        json_data = json.dumps({'dataset': f"FAILED: {scan_report_fetched_data['dataset']}"})

        response = requests.patch(
            url=f"{api_url}scanreports/{body['scan_report_id']}/",
            data=json_data, 
            headers=headers
        )
        raise Exception('dequeue_count > 1')

    # Grab scan report data from blob
    container_client = blob_service_client.get_container_client("scan-reports")
    blob_scanreport_client = container_client.get_blob_client(scan_report_blob)
    streamdownloader = blob_scanreport_client.download_blob()
    scanreport = BytesIO(streamdownloader.readall())

    # If dictionary is present, also download dictionary
    if data_dictionary_blob != "None":
        # Access data as StorageStreamerDownloader class
        # Decode and split the stream using csv.reader()
        container_client = blob_service_client.get_container_client("data-dictionaries")
        blob_dict_client = container_client.get_blob_client(data_dictionary_blob)
        streamdownloader = blob_dict_client.download_blob()
        data_dictionary = list(
            csv.DictReader(streamdownloader.readall().decode("utf-8").splitlines())
        )

    else:
        data_dictionary = None

    wb = openpyxl.load_workbook(scanreport, data_only=True)

    # Get the first sheet 'Field Overview',
    # to populate ScanReportTable & ScanReportField models
    ws = wb.worksheets[0]

    table_names = []
    # Skip header with min_row=2
    for i, row_cell in enumerate(ws.iter_rows(min_row=2), start=2):
        # If the value in the first column (i.e. the Table Col) is not blank;
        # Save the table name as a new entry in the model ScanReportTable
        # Checks for blank b/c White Rabbit seperates tables with blank row
        for cell in row_cell:
            if cell.value:
                name = ws.cell(row=i, column=1).value
                if name not in table_names:
                    table_names.append(name)

    """
    For each table create a scan_report_table entry,
    Append entry to data[] list,
    Create JSON array with all the entries, 
    Send POST request to API with JSON as input,
    Save the response data(table IDs)
    """
    table_ids = []
    field_ids = []
    field_names = []
    data = []
    # print("Working on Scan Report >>>", body["scan_report_id"])

    print("TABLES NAMES >>> ", table_names)

    for table in range(len(table_names)):

        print("WORKING ON TABLE >>> ", table)

        # Truncate table names because sheet names are truncated to 31 characters in Excel
        table_names[table] = table_names[table][:31]

        # Create ScanReportTable entry
        # Link to scan report using ID from the queue message
        scan_report_table_entry = {
            "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "name": table_names[table],
            "scan_report": str(body["scan_report_id"]),
            "person_id": None,
            "birth_date": None,
            "measurement_date": None,
            "condition_date": None,
            "observation_date": None,
        }
        print("SCAN REPORT TABLE ENTRY", scan_report_table_entry)

        # Append to list
        data.append(scan_report_table_entry)

    # Create JSON array
    json_data = json.dumps(data)
    # POST request to scanreporttables
    response = requests.post(
        "{}scanreporttables/".format(api_url), data=json_data, headers=headers
    )
    print("TABLE SAVE STATUS >>>", response.status_code)

    # Load the result of the post request,
    response = json.loads(response.content.decode("utf-8"))

    # Save the table ids that were generated from the POST method
    for element in range(len(response)):
        table_ids.append(response[element]["id"])
    # print("TABLE IDs", table_ids)

    """
    POST fields per table:
    For each row in Field Overview create an entry for scan_report_field,
    Empty row signifies end of fields in a table
    Append field entry to data[] list,
    Create JSON array with all the field entries, 
    Send POST request to API with JSON as input,
    Save the response data(field ids,field names) in a dictionary
    Set the current working sheet to be the same as the current table
    Post the values for that table
    """
    table_idx = 0
    data = []
    names_x_ids = {}
    # For sheets past the first two in the Scan Report
    # i.e. all 'data' sheets that are not Field Overview and Table Overview
    worksheet_idx = 2

    for i, row_cell in enumerate(
        ws.iter_rows(min_row=2, max_row=ws.max_row + 1), start=2
    ):

        if table_idx >= len(table_ids):
            continue
        # If fraction empty or fraction unique is empty set to 0(decimal)
        if not (ws.cell(row=i, column=8).value):
            ws.cell(row=i, column=8).value = 0.0
        if not (ws.cell(row=i, column=10).value):
            ws.cell(row=i, column=10).value = 0.0

        # Create ScanReportField entry
        scan_report_field_entry = {
            "scan_report_table": table_ids[table_idx],
            "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "name": ws.cell(row=i, column=2).value,
            "description_column": str(ws.cell(row=i, column=3).value),
            "type_column": str(ws.cell(row=i, column=4).value),
            "max_length": ws.cell(row=i, column=5).value,
            "nrows": ws.cell(row=i, column=6).value,
            "nrows_checked": ws.cell(row=i, column=7).value,
            "fraction_empty": round(ws.cell(row=i, column=8).value, 2),
            "nunique_values": ws.cell(row=i, column=9).value,
            "fraction_unique": round(ws.cell(row=i, column=10).value, 2),
            "flag_column": str(ws.cell(row=i, column=11).value),
            "ignore_column": None,
            "is_birth_date": False,
            "is_patient_id": False,
            "is_date_event": False,
            "is_ignore": False,
            "pass_from_source": True,
            "classification_system": str(ws.cell(row=i, column=12).value),
            "date_type": "",
            "concept_id": -1,
            "field_description": None,
        }
        # Append each entry to a list
        data.append(scan_report_field_entry)

        # If there is an empty row (end of a table) POST fields in this table
        if not any(cell.value for cell in row_cell):
            # .pop() empty row from list,
            data.pop()
            # JSON Array for fields in current table
            json_data = json.dumps(data)
            # POST Fields
            response = requests.post(
                "{}scanreportfields/".format(api_url),
                data=json_data,
                headers=headers,
            )
            # print("FIELD SAVE STATUS >>>", response.status_code)
            # Load result from the response,
            # Save generated field ids, and the corresponding name
            response = json.loads(response.content.decode("utf-8"))
            for element in range(len(response)):
                field_ids.append(str(response[element].get("id", None)))
                field_names.append(str(response[element].get("name", None)))
            # Create a dictionary with field names and field ids
            # as key value pairs
            # e.g ("Field ID":<Field Name>)
            names_x_ids = dict(zip(field_names, field_ids))

            # print("Dictionary id:name", id_x_names)
            # Reset list for values
            data = []
            # Go to Table sheet
            sheet = wb.worksheets[worksheet_idx]
            # print("WORKING ON", sheet.title)

            # Skip these sheets at the end of the scan report
            if sheet.title == "_" or (sheet.title.startswith("HTA")):
                continue
            # Get value,frequency for each field in the table
            results = process_scan_report_sheet_table(sheet)

            """
            For every result of process_scan_report_sheet_table,
            Save the current name,value,frequency
            Create ScanReportValue entry,
            Append to data[] list,
            Create JSON array with all the value entries, 
            Send POST request to API with JSON as input
            """
            for result in range(len(results)):

                name = results[result][0]
                value = results[result][1][0:127]
                frequency = results[result][2]

                if not frequency:
                    frequency = 0

                if data_dictionary is not None:
                    # Look up value description
                    val_desc = next(
                        (
                            row["value"]
                            for row in data_dictionary
                            if str(row["field_name"]) == str(name)
                            and str(row["code"]) == str(value)
                        ),
                        None,
                    )

                    # Grab data from the 'code' column in the data dictionary
                    # 'code' can contain an ordinary value (e.g. Yes, No, Nurse, Doctor)
                    # or it could contain one of our pre-defined vocab names
                    # e.g. SNOMED, RxNorm, ICD9 etc.
                    code = next(
                        (
                            row["code"]
                            for row in data_dictionary
                            if str(row["field_name"]) == str(name)
                        ),
                        None,
                    )

                    # If 'code' is in our vocab list, try and convert the ScanReportValue (concept code) to conceptID
                    # If there's a faulty concept code for the vocab, fail gracefully and set concept_id to default (-1)
                    if code in vocabs:
                        try:
                            concept_id = omop_helpers.get_concept_from_concept_code(
                                concept_code=value,
                                vocabulary_id=code,
                                no_source_concept=True,
                            )
                            concept_id = concept_id["concept_id"]
                        except:
                            concept_id = -1
                    else:
                        concept_id = -1

                else:
                    val_desc = None
                    concept_id = -1

                # Create ScanReportValue entry
                # We temporarily utilise the redundant 'conceptID' field in ScanReportValue
                # to save any looked up conceptIDs in the previous block of code.
                # The conceptID will be cleared later
                scan_report_value_entry = {
                    "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    "value": value,
                    "frequency": int(frequency),
                    "conceptID": concept_id,
                    "value_description": val_desc,
                    "scan_report_field": names_x_ids[name],
                }

                # Append to list
                data.append(scan_report_value_entry)

            # Create JSON array for POSTing
            json_data = json.dumps(data)

            # POST data to ScanReportValues model
            response = requests.post(
                url=api_url + "scanreportvalues/", data=json_data, headers=headers
            )

            # Process conceptIDs in ScanReportValues
            # GET values where the conceptID != -1 (i.e. we've converted a concept code to conceptID in the previous code)
            new_data = requests.get(
                url=api_url
                + "scanreportvaluepks/?scan_report="
                + str(body["scan_report_id"]),
                headers=headers,
            )

            data = json.loads(new_data.content.decode("utf-8"))

            # Create a list for a bulk data upload to the ScanReportConcept model
            concept_id_data = []
            for concept in data:

                entry = {
                    "nlp_entity": None,
                    "nlp_entity_type": None,
                    "nlp_confidence": None,
                    "nlp_vocabulary": None,
                    "nlp_processed_string": None,
                    "concept": concept["conceptID"],
                    "object_id": concept["id"],
                    "content_type": 17,
                }

                concept_id_data.append(entry)

            concept_id_data_json = json.dumps(concept_id_data)

            # POST the ScanReportConcept data to the model
            response = requests.post(
                url=api_url + "scanreportconcepts/",
                headers=headers,
                data=concept_id_data_json,
            )

            print("STATUS >>> ", response.status_code)

            # Update ScanReportValue to remove any data added to the conceptID field
            # conceptID field only used temporarily to hold the converted concept code -> conceptID
            # Now the conceptID is saved to the correct model (ScanReportConcept) there's no
            # need for the concept ID to also be saved to ScanReportValue::conceptID

            # Reset conceptID to -1 (default)
            put_update = {"conceptID": -1}
            put_update_json = json.dumps(put_update)

            for concept in data:
                response = requests.patch(
                    url=api_url + "scanreportvalues/" + str(concept["id"]) + "/",
                    headers=headers,
                    data=put_update_json,
                )

            # Move to next table, initialise empty arrays for next table
            table_idx = table_idx + 1
            worksheet_idx = worksheet_idx + 1
            field_ids = []
            field_names = []
            data = []
