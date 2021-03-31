from django.test import TestCase

from .services import process_scan_report_sheet_table, build_usagi_index, run_usagi


class ServiceTests(TestCase):

    def test_process_scan_report_sheet_table(self):

            # Tell it what file you want to process
            filename = '/api/mapping/data/value_frequency_test_data.csv'

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
        
    def test_nlp(self):
    
        # POST 
        url = "https://ccnett2.cognitiveservices.azure.com/text/analytics/v3.1-preview.3/entities/health/jobs?stringIndexType=TextElements_v8"
        payload="{\n  \"documents\": [\n    {\n      \"language\": \"en\",\n      \"id\": \"source_field\",\n      \"text\": \"Headache\"\n    }\n  ]\n}"            
        headers = {
            'Ocp-Apim-Subscription-Key': os.environ.get('NLP_API_KEY'),
            'Content-Type': 'application/json; utf-8'
        }

        response = requests.post(url, headers=headers, data=payload)
        print('POST STATUS CODE >>> ', response.status_code)
        print('HEADERS >>> ', response.headers)
        
        # Add a short artificial wait to give the NLP service
        # time to run the job
        time.sleep(5)

        # GET
        get_response = requests.get(response.headers['operation-location'], headers=headers)
        x = get_response.json()
        print(json.dumps(x, indent=4))