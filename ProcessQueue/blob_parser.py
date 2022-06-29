import csv
import os

from io import BytesIO

import openpyxl

from azure.storage.blob import BlobServiceClient
import logging
logger = logging.getLogger("test_logger")


def remove_BOM(intermediate):
    """
    Given a list of dictionaries, remove any occurrences of the BOM in the keys
    """
    return [
        {key.replace("\ufeff", ""): value for key, value in d.items()}
        for d in intermediate
    ]


def process_three_item_dict(three_item_data):
    """
    Converts a list of dictionaries (each with keys 'csv_file_name', 'field_name' and
    'code') to a nested dictionary with indices 'csv_file_name', 'field_name' and
    internal value 'code'.

    [{'csv_file_name': 'table1', 'field_name': 'field1', 'value': 'value1', 'code':
    'code1'},
    {'csv_file_name': 'table1', 'field_name': 'field2', 'value': 'value2'},
    {'csv_file_name': 'table2', 'field_name': 'field2', 'value': 'value2', 'code':
    'code2'},
    {'csv_file_name': 'table3', 'field_name': 'field3', 'value': 'value3', 'code':
    'code3'}]
    ->
    {'table1': {'field1': 'value1', 'field2': 'value2'},
     'table2': {'field2': 'value2'},
     'table3': {'field3': 'value3}
    }
    """
    csv_file_names = set(row["csv_file_name"] for row in three_item_data)

    # Initialise the dictionary with the keys, and each value set to a blank dict()
    new_vocab_dictionary = dict((filename, {}) for filename in csv_file_names)

    # Fill each subdict with the data from the input list
    for row in three_item_data:
        new_vocab_dictionary[row["csv_file_name"]][row["field_name"]] = row["code"]

    return new_vocab_dictionary


def process_four_item_dict(four_item_data):
    """
    Converts a list of dictionaries (each with keys 'csv_file_name', 'field_name' and
    'code' and 'value') to a nested dictionary with indices 'csv_file_name',
    'field_name', 'code', and internal value 'value'.

    [{'csv_file_name': 'table1', 'field_name': 'field1', 'value': 'value1', 'code':
    'code1'},
    {'csv_file_name': 'table1', 'field_name': 'field2', 'value': 'value2', 'code':
    'code2'},
    {'csv_file_name': 'table2', 'field_name': 'field2', 'value': 'value2', 'code':
    'code2'},
    {'csv_file_name': 'table2', 'field_name': 'field2', 'value': 'value3', 'code':
    'code3'},
    {'csv_file_name': 'table3', 'field_name': 'field3', 'value': 'value3', 'code':
    'code3'}]
    ->
    {'table1': {'field1': {'value1': 'code1'}, 'field2': {'value2': 'code2'}},
     'table2': {'field2': {'value2': 'code2', 'value3': 'code3'}},
     'table3': {'field3': {'value3': 'code3'}}
    }
    """
    csv_file_names = set(row["csv_file_name"] for row in four_item_data)

    # Initialise the dictionary with the keys, and each value set to a blank dict()
    new_data_dictionary = dict.fromkeys(csv_file_names, {})

    for row in four_item_data:
        if row["field_name"] not in new_data_dictionary[row["csv_file_name"]]:
            new_data_dictionary[row["csv_file_name"]][row["field_name"]] = {}
        new_data_dictionary[row["csv_file_name"]][row["field_name"]][row["code"]] = row[
            "value"
        ]

    return new_data_dictionary


# @memory_profiler.profile(stream=profiler_logstream)
def parse_blobs(scan_report_blob, data_dictionary_blob):
    """
    Given two strings, download the two files so named in the storage account given
    by the STORAGE_CONN_STRING environment variable.

    Open the scan_reort_blob in memory.

    Split the contents of data_dictionary_blob into two parts, each of which is a
    nested dictionary.

    Return all 3.
    """
    # Set Storage Account connection string
    blob_service_client = BlobServiceClient.from_connection_string(
        os.environ.get("STORAGE_CONN_STRING")
    )

    # Grab scan report data from blob
    streamdownloader = (
        blob_service_client.get_container_client("scan-reports")
        .get_blob_client(scan_report_blob)
        .download_blob()
    )
    scanreport_bytes = BytesIO(streamdownloader.readall())
    workbook = openpyxl.load_workbook(
        scanreport_bytes, data_only=True, keep_links=False, read_only=True
    )

    # If dictionary is present, also download dictionary
    if data_dictionary_blob != "None":
        # Access data as StorageStreamerDownloader class
        # Decode and split the stream using csv.reader()
        dict_client = blob_service_client.get_container_client("data-dictionaries")
        blob_dict_client = dict_client.get_blob_client(data_dictionary_blob)

        # Grab all rows with 4 elements for use as value descriptions
        data_dictionary_intermediate = list(
            row
            for row in csv.DictReader(
                blob_dict_client.download_blob().readall().decode("utf-8").splitlines()
            )
            if row["value"] != ""
        )
        # Remove BOM from start of file if it's supplied.
        dictionary_data = remove_BOM(data_dictionary_intermediate)

        # Convert to nested dictionaries, with structure
        # {tables: {fields: {values: value description}}}
        data_dictionary = process_four_item_dict(dictionary_data)

        # Grab all rows with 3 elements for use as possible vocabs
        vocab_dictionary_intermediate = list(
            row
            for row in csv.DictReader(
                blob_dict_client.download_blob().readall().decode("utf-8").splitlines()
            )
            if row["value"] == ""
        )
        vocab_data = remove_BOM(vocab_dictionary_intermediate)

        # Convert to nested dictionaries, with structure
        # {tables: {fields: vocab}}
        vocab_dictionary = process_three_item_dict(vocab_data)

    else:
        data_dictionary = None
        vocab_dictionary = None

    return workbook, data_dictionary, vocab_dictionary
