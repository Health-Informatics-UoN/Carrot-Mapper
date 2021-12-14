import os
from io import BytesIO, StringIO
from azure.storage.blob import BlobServiceClient
import csv
import openpyxl
from django.http.response import HttpResponse


def download_scan_report_blob(blob_name,container="scan-reports"):
    # Set Storage Account connection string
    blob_service_client = BlobServiceClient.from_connection_string(
        os.environ.get("STORAGE_CONN_STRING")
    )
    print(blob_name,container)
    
    # Grab scan report data from blob
    streamdownloader = blob_service_client.get_container_client(container).\
        get_blob_client(blob_name).download_blob()
    scanreport_bytes = BytesIO(streamdownloader.readall().decode("utf-8"))
    wb = openpyxl.load_workbook(scanreport_bytes)
    # wb=xlrd.open_workbook(scanreport_bytes)
    # wb=openpyxl.load_workbook(streamdownloader.readall())
    # print(wb.worksheets[0].title)
    wb.save(scanreport_bytes)
    # wb.close()
    scanreport_bytes.seek(0)
    print(scanreport_bytes.read())
    response = HttpResponse(scanreport_bytes,content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; base64')
    response['Content-Disposition'] = f'attachment; filename="{blob_name}"'
    
    return response
        
def download_data_dictionary_blob(blob_name,container="data-dictionaries"):
    blob_service_client = BlobServiceClient.from_connection_string(
    os.environ.get("STORAGE_CONN_STRING")
    )
    # Access data as StorageStreamerDownloader class
    # Decode and split the stream using csv.DictReader()
    container_client = blob_service_client.get_container_client("data-dictionaries")
    blob_dict_client = container_client.get_blob_client(blob_name)
    streamdownloader = blob_dict_client.download_blob()
    data_dictionary =csv.DictReader(streamdownloader.readall().decode("utf-8").splitlines())

    # Set up headers, string buffer and a DictWriter object
    headers=[]
    buffer = StringIO()
    
    headers = ['csv_file_name','field_name','code','value']
    writer = csv.DictWriter(buffer, lineterminator='\n', delimiter=',',quoting=csv.QUOTE_NONE,fieldnames=headers)
    writer.writeheader()
    # Remove BOM from start of file if it's supplied.
    data_dictionary = [{key.replace("\ufeff",""): value
                        for key, value in d.items()}
                        for d in data_dictionary]
    for d in data_dictionary:
        writer.writerow(d)
    
    # Go back to the start of the buffer and return in response
    buffer.seek(0)

    response = HttpResponse(buffer,content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{blob_name}"'
    
    return response
    