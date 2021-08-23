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

from requests.models import HTTPError

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
    column a, banana, 3
    column c, orange, 5
    column c, plantain, 50
    --
    """
    results = []

    # Skip headers, set min_row & row_idx=2
    for column_idx, col in enumerate(
        sheet.iter_cols(min_col=1,
                        max_col=sheet.max_column,
                        min_row=1,
                        max_row=sheet.max_row),
        start=1
    ):
        if column_idx % 2 == 0:
            continue

        column_header = col[0].value

        # Works through pairs of value/frequency columns. Skip the frequency columns,
        # and reference them from their value column.
        for row_idx, cell in enumerate(col[1:], start=2):
            if column_idx % 2 == 1:

                value = cell.value
                frequency = sheet.cell(row=row_idx, column=column_idx + 1).value

                # As we move down rows, check that there's data there.
                # This is required b/c value/frequency col pairs differ
                # in the number of rows. Break if we hit a fully empty row
                if (value == "" or value is None) and (
                    frequency == "" or frequency is None
                ):
                    break

                # Append to Results as (Field Name,Value,Frequency)
                results.append(
                    (
                        str(column_header),
                        str(value),
                        frequency,
                    )
                )
    return results


def default_zero(input):
    """
    Helper function that returns the input, replacing anything Falsey 
    (such as Nones or empty strings) with 0.0.
    """
    return round(input if input else 0.0, 2)


def main(msg: func.QueueMessage):
    logging.info("Python queue trigger function processed a queue item.")
    print(datetime.utcnow().strftime("%H:%M:%S.%fZ"))
    # Set up ccom API parameters:
    api_url = os.environ.get("APP_URL") + "api/"
    headers = {
        "Content-type": "application/json",
        "charset": "utf-8",
        "Authorization": "Token {}".format(os.environ.get("AZ_FUNCTION_KEY")),
    }

    # Get message from queue
    message = {
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
    
    print("message:", type(message), message)
    # Grab message body from storage queues,
    # extract filenames for scan reports and dictionaries
    # print("body 1:", type(message["body"]), message["body"])
    body = json.loads(message["body"])
    # print("body 2:", type(body), body)
    scan_report_blob = body["scan_report_blob"]
    data_dictionary_blob = body["data_dictionary_blob"]
    parent_sr_id=body['parent_SR_id']

    print("MESSAGE BODY >>>", body)

    # If the message has been dequeued for a second time, then the upload has failed.
    # Patch the name of the dataset to make it clear that it has failed, and then stop.
    print("dequeue_count", msg.dequeue_count)
    if msg.dequeue_count == 2:
        scan_report_fetched_data = requests.get(
            url=f"{api_url}scanreports/{body['scan_report_id']}/",
            headers=headers,
        )

        scan_report_fetched_data = json.loads(scan_report_fetched_data.content.decode("utf-8"))

        json_data = json.dumps({'dataset': f"FAILED: {scan_report_fetched_data['dataset']}"})

        dequeue_response = requests.patch(
            url=f"{api_url}scanreports/{body['scan_report_id']}/",
            data=json_data, 
            headers=headers
        )
    if msg.dequeue_count > 1:
        raise Exception('dequeue_count > 1')

    # Otherwise, this must be the first time we've seen this message. Proceed.
    print("Get blobs", datetime.utcnow().strftime("%H:%M:%S.%fZ"))
    # Set Storage Account connection string
    blob_service_client = BlobServiceClient.from_connection_string(
        os.environ.get("STORAGE_CONN_STRING")
    )

    # Grab scan report data from blob
    streamdownloader = blob_service_client.get_container_client("scan-reports").\
        get_blob_client(scan_report_blob).download_blob()
    scanreport_bytes = BytesIO(streamdownloader.readall())

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

    wb = openpyxl.load_workbook(scanreport_bytes, data_only=True, keep_links=False)

    # Get the first sheet 'Field Overview',
    # to populate ScanReportTable & ScanReportField models
    fo_ws = wb.worksheets[0]

    # Get all the table names in the order they appear in the Field Overview page
    table_names = []
    # Skip header row
    for cell in fo_ws['A'][1:]:
        # Check value is both non-empty and not seen before
        if cell.value and cell.value not in table_names:
            table_names.append(cell.value)

    """
    For each table create a scan_report_table entry,
    Append entry to table_entries_to_post[] list,
    Create JSON array with all the entries,
    Send POST request to API with JSON as input,
    Save the response data(table IDs)
    """
    table_entries_to_post = []
    # print("Working on Scan Report >>>", body["scan_report_id"])

    print("TABLES NAMES >>> ", table_names)

    for table_name in table_names:

        print("WORKING ON TABLE >>> ", table_name)

        # Truncate table names because sheet names are truncated to 31 characters in Excel
        short_table_name = table_name[:31]

        # Create ScanReportTable entry
        # Link to scan report using ID from the queue message
        table_entry = {
            "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "name": short_table_name,
            "scan_report": str(body["scan_report_id"]),
            "person_id": None,
            "birth_date": None,
            "measurement_date": None,
            "condition_date": None,
            "observation_date": None,
        }

        print("SCAN REPORT TABLE ENTRY", table_entry)

        # Append to list
        table_entries_to_post.append(table_entry)

    print("POST tables", datetime.utcnow().strftime("%H:%M:%S.%fZ"))
    # POST request to scanreporttables
    tables_response = requests.post(
        "{}scanreporttables/".format(api_url), 
        data=json.dumps(table_entries_to_post), 
        headers=headers
    )

    print("POST tables finished", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

    print("TABLE SAVE STATUS >>>", tables_response.status_code)
    # Error on failure
    if tables_response.status_code != 201:
        raise HTTPError(' '.join(['Error in table save:', str(tables_response.status_code), str(json.dumps(table_entries_to_post))]))

    # Load the result of the post request,
    tables_content = json.loads(tables_response.content.decode("utf-8"))

    # Save the table ids that were generated from the POST method
    table_ids = [element["id"] for element in tables_content]

    print("TABLE IDs", table_ids)

    """
    POST fields per table:
    For each row in Field Overview create an entry for scan_report_field,
    Empty row signifies end of fields in a table
    Append field entry to field_entries_to_post[] list,
    Create JSON array with all the field entries, 
    Send POST request to API with JSON as input,
    Save the response data(field ids,field names) in a dictionary
    Set the current working sheet to be the same as the current table
    Post the values for that table
    """
    table_idx = 0
    field_entries_to_post = []
    names_x_ids = {}

    # Loop over all rows in Field Overview sheet.
    # For sheets past the first two in the Scan Report
    # i.e. all 'data' sheets that are not Field Overview and Table Overview
    worksheet_idx = 2
    print("Start fields loop", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

    for i, row_cell in enumerate(
        fo_ws.iter_rows(min_row=2, max_row=fo_ws.max_row + 1), start=2
    ):

        if table_idx >= len(table_ids):
            continue

        # Create ScanReportField entry
        field_entry = {
            "scan_report_table": table_ids[table_idx],
            "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "name": str(fo_ws.cell(row=i, column=2).value),
            "description_column": str(fo_ws.cell(row=i, column=3).value),
            "type_column": str(fo_ws.cell(row=i, column=4).value),
            "max_length": fo_ws.cell(row=i, column=5).value,
            "nrows": fo_ws.cell(row=i, column=6).value,
            "nrows_checked": fo_ws.cell(row=i, column=7).value,
            "fraction_empty": round(default_zero(fo_ws.cell(row=i, column=8).value), 2),
            "nunique_values": fo_ws.cell(row=i, column=9).value,
            "fraction_unique": round(default_zero(fo_ws.cell(row=i, column=10).value), 2),
            # "flag_column": str(fo_ws.cell(row=i, column=11).value),
            "ignore_column": None,
            "is_birth_date": False,
            "is_patient_id": False,
            "is_date_event": False,
            "is_ignore": False,
            "pass_from_source": True,
            # "classification_system": str(fo_ws.cell(row=i, column=12).value),
            "date_type": "",
            "concept_id": -1,
            "field_description": None,
        }
        # Append each entry to a list
        field_entries_to_post.append(field_entry)

        # print("scan_report_field_entries >>>", field_entries_to_post)

        # If this is a non-empty row (end of a table), continue to the next row. 
        if any(cell.value for cell in row_cell):
            continue

        # Otherwise, .pop() the empty row from the list, and proceed to POST 
        # fields in this table
        field_entries_to_post.pop()
        # print("FIELDS TO SAVE:", field_entries_to_post)

        print("POST fields", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

        # POST Fields
        fields_response = requests.post(
            "{}scanreportfields/".format(api_url),
            data=json.dumps(field_entries_to_post),
            headers=headers,
        )
        print("POST fields finished", datetime.utcnow().strftime("%H:%M:%S.%fZ")) # Can be 90s locally
        # Reset field_entries_to_post for reuse on next row
        field_entries_to_post = []
        print("FIELDS SAVE STATUS >>>", fields_response.status_code, fields_response.reason)

        if fields_response.status_code != 201:
            raise HTTPError(' '.join(['Error in fields save:', str(fields_response.status_code), str(json.dumps(field_entries_to_post))]))

        # Load result from the response,
        # Save generated field ids, and the corresponding name
        fields_content = json.loads(fields_response.content.decode("utf-8"))
        # print("FIELDS CONTENT:", fields_content)
        
        # Create a dictionary with field names and field ids
        # as key value pairs
        # e.g ("Field ID":<Field Name>)
        names_to_ids_dict = {str(element.get("name", None)): str(element.get("id", None)) for element in fields_content}

        # print("Dictionary id:name", names_to_ids_dict)
        # Reset list for values
        value_entries_to_post = []
        # Go to Table sheet
        sheet = wb.worksheets[worksheet_idx]
        # print("WORKING ON", sheet.title)

        # Skip these sheets at the end of the scan report
        if sheet.title == "_" or (sheet.title.startswith("HTA")):
            continue

        # Get (col_name, value, frequency) for each field in the table
        fieldname_value_freq_tuples = process_scan_report_sheet_table(sheet)

        """
        For every result of process_scan_report_sheet_table,
        Save the current name,value,frequency
        Create ScanReportValue entry,
        Append to value_entries_to_post[] list,
        Create JSON array with all the value entries, 
        Send POST request to API with JSON as input
        """
        for fieldname_value_freq in fieldname_value_freq_tuples:

            name = fieldname_value_freq[0]
            value = fieldname_value_freq[1][0:127]
            frequency = fieldname_value_freq[2]

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
                "scan_report_field": names_to_ids_dict[name],
            }

            # Append to list
            value_entries_to_post.append(scan_report_value_entry)

        print("POST values", datetime.utcnow().strftime("%H:%M:%S.%fZ"))
        # POST value_entries_to_post to ScanReportValues model
        values_response = requests.post(
            url=api_url + "scanreportvalues/", 
            data=json.dumps(value_entries_to_post), 
            headers=headers
        )
        if values_response.status_code != 201:
            raise HTTPError(' '.join(['Error in values save:', str(values_response.status_code), str(json.dumps(value_entries_to_post))]))

        print("POST values finished", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

        # Process conceptIDs in ScanReportValues
        # GET values where the conceptID != -1 (i.e. we've converted a concept code to conceptID in the previous code)
        print("GET posted values", datetime.utcnow().strftime("%H:%M:%S.%fZ"))
        get_ids_of_posted_values = requests.get(
            url=api_url
            + "scanreportvaluepks/?scan_report="
            + str(body["scan_report_id"]),
            headers=headers,
        )
        print("GET posted values finished", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

        ids_of_posted_values = json.loads(get_ids_of_posted_values.content.decode("utf-8"))

        # Create a list for a bulk data upload to the ScanReportConcept model

        concept_id_data = [{
                "nlp_entity": None,
                "nlp_entity_type": None,
                "nlp_confidence": None,
                "nlp_vocabulary": None,
                "nlp_processed_string": None,
                "concept": concept["conceptID"],
                "object_id": concept["id"],
                # TODO: we should query this value from the API 
                # - via ORM it would be ContentType.objects.get(model='scanreportvalue').id,
                # but that's not available from an Azure Function.
                "content_type": 17,
            } for concept in ids_of_posted_values]
        
        print("POST concepts", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

        # POST the ScanReportConcept data to the model
        concept_response = requests.post(
            url=api_url + "scanreportconcepts/",
            headers=headers,
            data=json.dumps(concept_id_data),
        )
        print("POST concepts finished", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

        print("STATUS >>> ", concept_response.status_code)
        if concept_response.status_code != 201:
            raise HTTPError(' '.join(['Error in concept save:', str(concept_response.status_code), str(json.dumps(concept_id_data))]))

        # Update ScanReportValue to remove any data added to the conceptID field
        # conceptID field only used temporarily to hold the converted concept code -> conceptID
        # Now the conceptID is saved to the correct model (ScanReportConcept) there's no
        # need for the concept ID to also be saved to ScanReportValue::conceptID

        # Reset conceptID to -1 (default)
        put_update_json = json.dumps({"conceptID": -1})
        
        print("PATCH values", datetime.utcnow().strftime("%H:%M:%S.%fZ"))
        for concept in ids_of_posted_values:
            print("PATCH value", datetime.utcnow().strftime("%H:%M:%S.%fZ"))
            value_response = requests.patch(
                url=api_url + "scanreportvalues/" + str(concept["id"]) + "/",
                headers=headers,
                data=put_update_json,
            )
            print("PATCH value finished", datetime.utcnow().strftime("%H:%M:%S.%fZ"))
            if value_response.status_code != 200:
                raise HTTPError(' '.join(['Error in value save:', str(value_response.status_code), str(put_update_json)]))

        print("PATCH values finished", datetime.utcnow().strftime("%H:%M:%S.%fZ"))
        # Move to next table, initialise empty arrays for next table
        table_idx = table_idx + 1
        worksheet_idx = worksheet_idx + 1

    if parent_sr_id is not "None":
        # Grab Parent Scan Report
        parent_scan_report = requests.get(
                    url=api_url
                    + "scanreporttablesfilter/?scan_report="
                    + str(parent_sr_id),
                    headers=headers,
                )
        parent_tables=[]
        child_tables=[]
        child_scan_report=requests.get(
                    url=api_url
                    + "scanreporttablesfilter/?scan_report="
                    + str(scan_report_id),
                    headers=headers,
                )
        
        response_parent = json.loads(parent_scan_report.content.decode("utf-8"))
        response_child=json.loads(child_scan_report.content.decode("utf-8"))

        print("PARENT SCAN REPORT TABLES:",response_parent)
        print("CHILD SCAN REPORT TABLES",response_child)
        for element in range(len(response_parent)):
            parent_tables.append(response_parent[element]["name"])
            
        print(parent_tables)

        

