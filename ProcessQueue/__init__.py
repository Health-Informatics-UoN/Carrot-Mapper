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
                        max_row=sheet.max_row,
                        values_only=True),
        start=1
    ):
        if column_idx % 2 == 0:
            continue

        column_header = col[0]

        # Works through pairs of value/frequency columns. Skip the frequency columns,
        # and reference them from their value column.
        for row_idx, cell in enumerate(col[1:], start=2):
            if column_idx % 2 == 1:

                value = cell
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


def paginate(entries_to_post):
    """
    This expects a list of dicts, and returns a list of lists of dicts, 
    where the maximum length of each list of dicts, under JSONification, 
    is less than max_chars
    """
    max_chars = int(os.environ.get("PAGE_MAX_CHARS")) if os.environ.get("PAGE_MAX_CHARS") else 10000
    
    paginated_entries_to_post = []
    this_page = []
    for entry in entries_to_post:
        # print(len(json.dumps(entry)))
        if len(json.dumps(this_page)) + len(
                json.dumps(entry)) < max_chars:
            this_page.append(entry)
            # print(len(json.dumps(this_page)))
        else:
            paginated_entries_to_post.append(this_page)
            # print('saved:', len(json.dumps(this_page)))
            this_page = [entry]
            # print(len(json.dumps(this_page)))
    if this_page:
        paginated_entries_to_post.append(this_page)
    return paginated_entries_to_post


def process_failure(api_url, scan_report_id, headers):
    scan_report_fetched_data = requests.get(
            url=f"{api_url}scanreports/{scan_report_id}/",
            headers=headers,
    )

    scan_report_fetched_data = json.loads(scan_report_fetched_data.content.decode("utf-8"))

    json_data = json.dumps({'dataset': f"FAILED: {scan_report_fetched_data['dataset']}", 
                            'status': "UPFAILE"})

    failure_response = requests.patch(
        url=f"{api_url}scanreports/{scan_report_id}/",
        data=json_data, 
        headers=headers
    )


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

    print("MESSAGE BODY >>>", body)

    # If the message has been dequeued for a second time, then the upload has failed.
    # Patch the name of the dataset to make it clear that it has failed, 
    # set the status to 'Upload Failed', and then stop.
    print("dequeue_count", msg.dequeue_count)
    if msg.dequeue_count == 2:
        process_failure(api_url, body['scan_report_id'], headers)

    if msg.dequeue_count > 1:
        raise Exception('dequeue_count > 1')

    # Otherwise, this must be the first time we've seen this message. Proceed.

    # Set the status to 'Upload in progress'
    status_in_progress_response = requests.patch(
            url=f"{api_url}scanreports/{body['scan_report_id']}/",
            data=json.dumps({'status': "UPINPRO"}), 
            headers=headers
        )

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
        data_dictionary_intermediate = list(
                           csv.DictReader(streamdownloader.readall().decode("utf-8").splitlines())
        )
        # Remove BOM from start of file if it's supplied.
        data_dictionary = [{key.replace("\ufeff",""): value
                            for key, value in d.items()}
                           for d in data_dictionary_intermediate]
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
        process_failure(api_url, body['scan_report_id'], headers)
        raise HTTPError(' '.join(['Error in table save:', str(tables_response.status_code), str(json.dumps(table_entries_to_post))]))

    # Load the result of the post request,
    tables_content = json.loads(tables_response.content.decode("utf-8"))

    # Save the table ids that were generated from the POST method
    table_ids = [element["id"] for element in tables_content]

    print("TABLE IDs", table_ids)
    table_name_to_id_map = dict(zip(table_names, table_ids))

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
    field_entries_to_post = []

    # Loop over all rows in Field Overview sheet.
    # For sheets past the first two in the Scan Report
    # i.e. all 'data' sheets that are not Field Overview and Table Overview
    print("Start fields loop", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

    for i, row in enumerate(
        fo_ws.iter_rows(min_row=2, max_row=fo_ws.max_row), start=2
    ):
        if row[0].value != '' and row[0].value is not None:
            current_table_name = row[0].value
            # Create ScanReportField entry
            field_entry = {
                "scan_report_table": table_name_to_id_map[current_table_name],
                "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                "name": str(row[1].value),
                "description_column": str(row[2].value),
                "type_column": str(row[3].value),
                "max_length": row[4].value,
                "nrows": row[5].value,
                "nrows_checked": row[6].value,
                "fraction_empty": round(default_zero(row[7].value), 2),
                "nunique_values": row[8].value,
                "fraction_unique": round(default_zero(row[9].value), 2),
                # "flag_column": str(row[10].value),
                "ignore_column": None,
                "is_birth_date": False,
                "is_patient_id": False,
                "is_date_event": False,
                "is_ignore": False,
                "pass_from_source": True,
                # "classification_system": str(row[11].value),
                "date_type": "",
                "concept_id": -1,
                "field_description": None,
            }
            # Append each entry to a list
            field_entries_to_post.append(field_entry)

        else:
            # This is the scenario where the line is empty, so we're at the end of
            # the table. Don't add a field entry, but process all those so far.
            # print("scan_report_field_entries >>>", field_entries_to_post)

            # POST fields in this table
            print("POST", len(field_entries_to_post), "fields", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

            paginated_field_entries_to_post = paginate(field_entries_to_post)
            fields_response_content = []
            # POST Fields
            for page in paginated_field_entries_to_post:
                fields_response = requests.post(
                    "{}scanreportfields/".format(api_url),
                    data=json.dumps(page),
                    headers=headers,
                )
                # print('dumped:', json.dumps(page))
                print("FIELDS SAVE STATUS >>>", fields_response.status_code,
                      fields_response.reason, len(page), flush=True)

                if fields_response.status_code != 201:
                    process_failure(api_url, body['scan_report_id'], headers)
                    raise HTTPError(' '.join(
                        ['Error in fields save:', str(fields_response.status_code),
                         str(json.dumps(page))]))

                fields_content = json.loads(fields_response.content.decode("utf-8"))
                # print('fc:',fields_content)
                fields_response_content += fields_content
                # print('frc:', fields_response_content)

            print("POST fields all finished", datetime.utcnow().strftime("%H:%M:%S.%fZ"),
                  flush=True)
            # print('frc:', fields_response_content, flush=True)

            field_entries_to_post = []

            # Load result from the response,
            # Save generated field ids, and the corresponding name
            # print("FIELDS CONTENT:", fields_content)

            # Create a dictionary with field names and field ids
            # as key value pairs
            # e.g ("Field ID":<Field Name>)
            names_to_ids_dict = {str(element.get("name", None)): str(element.get("id", None)) for element in fields_response_content}

            # print("Dictionary id:name", names_to_ids_dict)
            # Reset list for values
            value_entries_to_post = []

            if current_table_name not in wb.sheetnames:
                process_failure(api_url, body['scan_report_id'], headers)
                raise ValueError(f"Attempting to access sheet '{current_table_name}'"
                                 f" in scan report, but no such sheet exists.")

            # Go to Table sheet to process all the values from the sheet
            sheet = wb[current_table_name]
            # print("WORKING ON", sheet.title)

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
                            if str(row["code"]) == str(value)
                            and str(row["field_name"]) == str(name)
                            and str(row["csv_file_name"]) == str(current_table_name)
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
                            and str(row["csv_file_name"]) == str(current_table_name)
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

            print("POST", len(value_entries_to_post), "values", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

            paginated_value_entries_to_post = paginate(value_entries_to_post)
            values_response_content = []

            for page in paginated_value_entries_to_post:

                # POST value_entries_to_post to ScanReportValues model
                values_response = requests.post(
                    url="{}scanreportvalues/".format(api_url),
                    data=json.dumps(page),
                    headers=headers
                )
                print("VALUES SAVE STATUS >>>", values_response.status_code,
                      values_response.reason, len(page), flush=True)
                if values_response.status_code != 201:
                    process_failure(api_url, body['scan_report_id'], headers)
                    raise HTTPError(' '.join(['Error in values save:', str(values_response.status_code), str(json.dumps(page))]))

                values_content = json.loads(values_response.content.decode("utf-8"))
                values_response_content += values_content

            print("POST values all finished", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

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

            print("POST", len(concept_id_data), "concepts", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

            paginated_concept_id_data = paginate(concept_id_data)

            concepts_response_content = []

            for page in paginated_concept_id_data:

                # POST the ScanReportConcept data to the model
                concepts_response = requests.post(
                    url=api_url + "scanreportconcepts/",
                    headers=headers,
                    data=json.dumps(page),
                )

                print("CONCEPT SAVE STATUS >>> ", concepts_response.status_code,
                      concepts_response.reason, flush=True)
                if concepts_response.status_code != 201:
                    process_failure(api_url, body['scan_report_id'], headers)
                    raise HTTPError(' '.join(['Error in concept save:', str(concepts_response.status_code), str(json.dumps(page))]))

                concepts_content = json.loads(concepts_response.content.decode("utf-8"))
                concepts_response_content += concepts_content

            print("POST concepts all finished", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

            # Update ScanReportValue to remove any data added to the conceptID field
            # conceptID field only used temporarily to hold the converted concept code -> conceptID
            # Now the conceptID is saved to the correct model (ScanReportConcept) there's no
            # need for the concept ID to also be saved to ScanReportValue::conceptID

            # Reset conceptID to -1 (default). This doesn't need pagination because it's a
            # loop over all relevant fields anyway
            put_update_json = json.dumps({"conceptID": -1})

            print("PATCH", len(ids_of_posted_values), "values", datetime.utcnow().strftime("%H:%M:%S.%fZ"))
            for concept in ids_of_posted_values:
                print("PATCH value", datetime.utcnow().strftime("%H:%M:%S.%fZ"))
                value_response = requests.patch(
                    url=api_url + "scanreportvalues/" + str(concept["id"]) + "/",
                    headers=headers,
                    data=put_update_json,
                )
                # print("PATCH value finished", datetime.utcnow().strftime("%H:%M:%S.%fZ"))
                if value_response.status_code != 200:
                    process_failure(api_url, body['scan_report_id'], headers)
                    raise HTTPError(' '.join(['Error in value save:', str(value_response.status_code), str(put_update_json)]))

            print("PATCH values finished", datetime.utcnow().strftime("%H:%M:%S.%fZ"))

    # Set the status to 'Upload Complete'
    status_complete_response = requests.patch(
            url=f"{api_url}scanreports/{body['scan_report_id']}/",
            data=json.dumps({'status': "UPCOMPL"}), 
            headers=headers
        )
