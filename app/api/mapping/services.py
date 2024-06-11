import csv
import os
from io import StringIO

from azure.storage.blob import BlobServiceClient
from django.http.response import HttpResponse


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
