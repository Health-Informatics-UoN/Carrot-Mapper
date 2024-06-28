import csv
import os
from io import StringIO

from azure.storage.blob import BlobServiceClient, ContentSettings
from django.http.response import HttpResponse
from shared.services.azurequeue import add_message
from typing import Optional


def download_data_dictionary_blob(blob_name, container="data-dictionaries"):
    blob_service_client = BlobServiceClient.from_connection_string(
        os.environ.get("STORAGE_CONN_STRING")
    )
    # Access data as StorageStreamerDownloader class
    # Decode and split the stream using csv.DictReader()
    container_client = blob_service_client.get_container_client("data-dictionaries")
    blob_dict_client = container_client.get_blob_client(blob_name)
    streamdownloader = blob_dict_client.download_blob()
    data_dictionary = csv.DictReader(
        streamdownloader.readall().decode("utf-8").splitlines()
    )

    # Set up headers, string buffer and a DictWriter object
    headers = []
    buffer = StringIO()

    headers = ["csv_file_name", "field_name", "code", "value"]
    writer = csv.DictWriter(
        buffer,
        lineterminator="\n",
        delimiter=",",
        quoting=csv.QUOTE_NONE,
        fieldnames=headers,
    )
    writer.writeheader()
    # Remove BOM from start of file if it's supplied.
    data_dictionary = [
        {key.replace("\ufeff", ""): value for key, value in d.items()}
        for d in data_dictionary
    ]
    for d in data_dictionary:
        writer.writerow(d)

    # Go back to the start of the buffer and return in response
    buffer.seek(0)

    response = HttpResponse(buffer, content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{blob_name}"'

    return response


def delete_blob(blob_name: str, container: str) -> bool:
    """
    Deletes a blob from the specified container.

    Args:
        blob_name (str): The name of the blob to delete.
        container (str): The name of the container where the blob is stored.

    Returns:
        bool: True if the blob was successfully deleted.
    """
    blob_service_client = BlobServiceClient.from_connection_string(
        os.environ.get("STORAGE_CONN_STRING")
    )
    container_client = blob_service_client.get_container_client(container)
    blob_dict_client = container_client.get_blob_client(blob_name)
    # Delete the blob
    blob_dict_client.delete_blob()
    return True


def modify_filename(filename: str, dt: str, rand: str) -> str:
    split_filename = os.path.splitext(str(filename))
    return f"{split_filename[0]}_{dt}_{rand}{split_filename[1]}"


def upload_files(sr_id, sr_name, sr_file, dict_name, dict_file: Optional[any] = None):
    blob_service_client = BlobServiceClient.from_connection_string(
        os.getenv("STORAGE_CONN_STRING")
    )
    azure_dict = {
        "scan_report_id": sr_id,
        "scan_report_blob": sr_name,
        "data_dictionary_blob": dict_name,
    }

    blob_client_sr = blob_service_client.get_blob_client(
        container="scan-reports", blob=sr_name
    )
    blob_client_sr.upload_blob(
        sr_file.open(),
        content_settings=ContentSettings(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
    )
    if dict_file is not None:
        blob_client_dict = blob_service_client.get_blob_client(
            container="data-dictionaries", blob=dict_name
        )
        blob_client_dict.upload_blob(dict_file.open())
    # send to the upload queue
    add_message(os.environ.get("UPLOAD_QUEUE_NAME"), azure_dict)
