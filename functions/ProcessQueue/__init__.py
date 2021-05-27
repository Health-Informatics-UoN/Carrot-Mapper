import logging
import json
import ast
import azure.functions as func
from azure.storage.blob import BlockBlobService
from io import BytesIO
import requests
import openpyxl
from datetime import datetime
import os

def main(msg: func.QueueMessage):
    logging.info('Python queue trigger function processed a queue item.')
    # Get message from queue
    message = json.dumps({
        'id': msg.id,
        'body': msg.get_body().decode('utf-8'),
        'expiration_time': (msg.expiration_time.isoformat()
                            if msg.expiration_time else None),
        'insertion_time': (msg.insertion_time.isoformat()
                           if msg.insertion_time else None),
        'time_next_visible': (msg.time_next_visible.isoformat()
                              if msg.time_next_visible else None),
        'pop_receipt': msg.pop_receipt,
        'dequeue_count': msg.dequeue_count
    })
    message=json.loads(message)
    body=ast.literal_eval(message["body"])
    filename=body["blob_name"]
    # Write File saved in Blob storage to BytesIO stream
    with BytesIO() as input_blob:
        with BytesIO() as output_blob:
            blob = BlockBlobService(
                    connection_string="DefaultEndpointsProtocol=https;AccountName=coconnectstoragedev;AccountKey=Xpsm2FYrH4umCmYNjvEaHlOW/p2NUhwEXmdFt6zrve8LVylkbPts3eEU5+tzC8U8W52yba8ysowVf13PnbUHJA==;EndpointSuffix=core.windows.net")           
            # Download as a stream
            blob.get_blob_to_stream(container_name='photos', blob_name=filename,stream=input_blob)
    
            input_blob.seek(0)
            
            # Create blob from processed file(not needed/testing)
            # blob.create_blob_from_stream('photos',"Changed-{}".format(filename), input_blob)
            api_url="http://localhost:8080/api/"
  
            # Load ByteIO() file in a openpyxl workbook
            wb = openpyxl.load_workbook(input_blob,data_only=True)
            # Get the first sheet 'Field Overview',
            # for populating ScanReportTable & ScanReportField models
            ws=wb.worksheets[0]
            table_names=[]
            # Skip header with min_row=2
            for i,row_cell in enumerate(ws.iter_rows(min_row=2),start = 2):
                # If the value in the first column (i.e. the Table Col) is not blank;
                # Save the table name as a new entry in the model ScanReportTable
                # Checks for blank b/c White Rabbit seperates tables with blank row
                for cell in row_cell:
                    if cell.value:
                        name=ws.cell(row=i,column=1).value
                        if name not in table_names:
                            table_names.append(name)
            #Truncate table name: [:31] because excel sheet names are truncated to 31 characters
            for table in range(len(table_names)): table_names[table]=table_names[table][:31]
            # Get request from ScanReportTable using scan report id & name
            for table in range(len(table_names)):
            
                scan_report_table_entry={
                    "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    "name": table_names[0],
                    "scan_report":str(body['scan_report_id']),
                    "person_id": None,
                    "birth_date": None,
                    "measurement_date": None,
                    "condition_date": None,
                    "observation_date": None
                }
                # This posts to api just fine,
                # Turn off for testing so I don't post more than one entries
                # response = requests.post("{}scanreporttables/".format(api_url), data=scan_report_table_entry)
            for i,col_cell in enumerate(ws.iter_cols(min_row=2),start = 2):
                for cell in col_cell:
                    scan_report_field_entry={
                        "scan_report_table":"",#get id from get request above
                        "name": ws.cell(row=i,column=2).value,
                        "description_column":ws.cell(row=i,column=3).value,
                        "type_column":ws.cell(row=i,column=4).value,
                        "max_length":ws.cell(row=i,column=5).value,
                        "nrows":ws.cell(row=i,column=6).value,
                        "nrows_checked":ws.cell(row=i,column=7).value,
                        "fraction_empty":ws.cell(row=i,column=8).value,
                        "nunique_values":ws.cell(row=i,column=9).value,
                        "fraction_unique":ws.cell(row=i,column=10).value,
                        "flag_column":ws.cell(row=i,column=11).value,
                        "is_patient_id":False,
                        "is_date_event":False,
                        "is_ignore":False,
                        "pass_from_source":True,
                        "classification_system":ws.cell(row=i,column=12).value,
                    }
                # for cells in ws.iter_rows():
            #     print([cell.value for cell in cells])
            
    
            
            #             if len(row) >= 11:
                           
            #             # Add each field in Field Overview to the model ScanReportField
            #             # Replace this with a post Request to ScanReportField
            #             scanreport={
            #                 "scan_report_table":scan_report_table_query,#get id from get request above
            #                 "name": row[1],
            #                 "description_column":row[2],
            #                 "type_column":row[3],
            #                 "max_length":row[4],
            #                 "nrows":row[5],
            #                 "nrows_checked":row[6],
            #                 "fraction_empty":row[7],
            #                 "nunique_values":row[8],
            #                 "fraction_unique":row[9],
            #                 "flag_column":row[10],
            #                 "is_patient_id":False,
            #                 "is_date_event":False,
            #                 "is_ignore":False,
            #                 "pass_from_source":True,
            #                 "classification_system":row[11],
            #             }
            
            #             scanreport["flag_column"]=scanreport["flag_column"].lower()
            #             if scanreport["flag_column"] == "patientid":
            #                 scanreport["is_patient_id"] = True
            #             else:
            #                 scanreport["is_patient_id"] = False

            #             if scanreport["flag_column"] == "date":
            #                 scanreport["is_date_event"] = True
            #             else:
            #                 scanreport["is_date_event"] = False

            #             if scanreport["flag_column"] == "ignore":
            #                     scanreport["is_ignore"] = True
            #             else:
            #                     scanreport["is_ignore"] = False
            #             # Replace model save with PUT request to ScanReport model
            #             scanreport.save()

            # response = requests.get(api_url, params=query)
            # print(response.json())
            # response = requests.post(api_url, data = data_partner_entry)
            # response = requests.get(api_url)
            # print(response)

    logging.info(body['blob_name'])
    


