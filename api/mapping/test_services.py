from django.test import TestCase
from .services import process_scan_report_sheet_table, build_usagi_index, run_usagi
import time, requests, os, json, math

from .models import ScanReport, DataPartner, ScanReportTable, ScanReportField, ScanReportValue, DataDictionary
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.models import User
from django.conf import settings
from django.core import serializers
from django.db.models.functions import Concat
from django.db.models import CharField, Value as V
from django.forms.models import model_to_dict


class ServiceTests(TestCase):
    def test_process_scan_report_sheet_table(self):

        # Tell it what file you want to process
        filename = "/api/mapping/data/value_frequency_test_data.csv"

        # Run the test on filename
        # This function is in services.py
        result = process_scan_report_sheet_table(filename)

        self.assertIs(4, len(result))

    def test_import_data_dictionary(self):
        x = import_data_dictionary()
        print(x)

    # Run this to build Usagi's index for the first time
    # Takes a long time to run!
    def test_build_usagi_index(self):
        x = build_usagi_index()
        print(x)

    # Run this to get Usagi going
    def test_run_usagi(self):
        x = run_usagi()
        print(x)

    # Run this to get data back from Azure NLP for Health Services
    def test_nlp(self):
        
        user = User.objects.get_or_create(
            username="testuser")[0]
         
        data_partner=DataPartner.objects.create(
            name="UoN"
        )
        
        sr = ScanReport.objects.create(
            data_partner = data_partner,
            author = user,
            name = "Foobar",
            dataset = "Dataset A",
            file = SimpleUploadedFile(
                "best_file_eva.txt",
                b"these are the file contents!"   # note the b in front of the string [bytes]
            )
        )
        
        srt=ScanReportTable.objects.create(
            scan_report = sr,
            name = "Occupation"
        )
        
        srf=ScanReportField.objects.create(
            scan_report_table = srt,
            name = "Occupation",
            description_column = "Test Field",
            type_column = "VARCHAR",
            max_length = 32,
            nrows = 1,   
            nrows_checked = 1,
            fraction_empty = 50.85,
            nunique_values = 100,
            fraction_unique = 12.5,
            ignore_column = False,
            is_patient_id = False,
            is_date_event = False,
            is_ignore = False,
            classification_system = None,
            date_type = "DOB",
            concept_id = None
        )
        
        srv1=ScanReportValue.objects.create(
            scan_report_field = srf,
            value = "Clinical Nurse",
            frequency = 5,
            conceptID = -1
        )
        
        srv2=ScanReportValue.objects.create(
            scan_report_field = srf,
            value = "GP",
            frequency = 5,
            conceptID = -1
        )
        
        srv3=ScanReportValue.objects.create(
            scan_report_field = srf,
            value = "Janitor",
            frequency = 5,
            conceptID = -1
        )
        
        DataDictionary.objects.create(
            source_value=srv1,
            dictionary_table="Occupation",
            dictionary_field="Occupation",
            dictionary_field_description="Staff member's job role",
            dictionary_value_code="Clinical Nurse",
            dictionary_value_description="Clinical nurse",
            definition_fixed=True
   
        )
        
        DataDictionary.objects.create(
            source_value=srv2,
            dictionary_table="Occupation",
            dictionary_field="Occupation",
            dictionary_field_description="Staff member's job role",
            dictionary_value_code="GP",
            dictionary_value_description="General practioner",
            definition_fixed=True
   
        )
        
        DataDictionary.objects.create(
            source_value=srv3,
            dictionary_table="Occupation",
            dictionary_field="Occupation",
            dictionary_field_description="Staff member's job role",
            dictionary_value_code="Janitor",
            dictionary_value_description="Janitor",
            definition_fixed=True
   
        )
        
        qs = DataDictionary.objects.all()
        
        # Create a concat field for NLP to work from
        # V is imported from models, used to comma separate other fields
        qs = qs.annotate(
            nlp_string=Concat(
                "source_value__value",
                V(", "),
                "dictionary_field_description",
                V(", "),
                "dictionary_value_description",
                output_field=CharField(),
            )
        )
        
 
        # Create object to convert to JSON
        for_json = qs.values_list(
            "id",
            "source_value__value",
            "source_value__scan_report_field__name",
            "nlp_string",
        )
    
        # Translate queryset into JSON-like dict for NLP
        documents = []
        for row in for_json:
            documents.append({
                'language':'en',
                'id':row[0],
                'text':row[3]
            })
        
        # Define NLP URL/headers
        url = "https://ccnett2.cognitiveservices.azure.com/text/analytics/v3.1-preview.3/entities/health/jobs?stringIndexType=TextElements_v8"
        headers = {
                        "Ocp-Apim-Subscription-Key": os.environ.get("NLP_API_KEY"),
                        "Content-Type": "application/json; utf-8",
                    }
        
        
        # POST Request(s)
        # Short wait at end of submission to let the API catch up
        chunk_size=2 # Set chunk size (max=10)
        post_response_url = []
        for i in range(0, len(documents), chunk_size):
            chunk = {"documents":documents[i:i+chunk_size]}
            payload = json.dumps(chunk)
            response = requests.post(url, headers=headers, data=payload)
            print(chunk, ' - ', response.status_code, response.reason)
            post_response_url.append(response.headers["operation-location"])
            time.sleep(5)
            
        # GET the response
        get_response = []
        for i in post_response_url:
        
            print('PROCESSING JOB >>>', i, '\n')
            req = requests.get(i, headers=headers)
            job = req.json()
            
            while job['status'] == "notStarted":
                print("Waiting...")
                time.sleep(2)
            else:
                print('JOB RESULT >>> ', job['results'])
                print("Completed!")
        
        # print('THE RESPONSE >>> ', get_response)
            
            # my_json = req.content.decode('utf8').replace("'", '"')
            # data = json.loads(req.content)
            # s = json.dumps(data, indent=4, sort_keys=True)
            # print(s)
                            
     
        # POST
        # url = "https://ccnett2.cognitiveservices.azure.com/text/analytics/v3.1-preview.3/entities/health/jobs?stringIndexType=TextElements_v8"
        # payload = json.dumps({"documents":documents})
        # headers = {
        #     "Ocp-Apim-Subscription-Key": os.environ.get("NLP_API_KEY"),
        #     "Content-Type": "application/json; utf-8",
        # }

        # response = requests.post(url, headers=headers, data=payload)
        # print("POST STATUS CODE >>> ", response.status_code)
        # print("POST REASON >>> ", response.reason)
        # print(dir(response))

        # # Add a short artificial wait to give the NLP service
        # # time to run the job
        # print('Short artifical wait...')
        # time.sleep(10)

        # # # GET
        # get_response = requests.get(
        #     response.headers["operation-location"], headers=headers
        # )
        # print('GET STATUS CODE >>> ', get_response.status_code)
        # x = get_response.json()
        # print(x.items())



        # print(json.dumps(x, indent=4))