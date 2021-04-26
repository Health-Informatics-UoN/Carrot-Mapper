from django.test import TestCase
from .services import (
    process_scan_report_sheet_table,
    build_usagi_index,
    run_usagi,
    nlp_single_string,
)
import time, requests, os, json, math
import pandas as pd

from .models import (
    ScanReport,
    DataPartner,
    ScanReportTable,
    ScanReportField,
    ScanReportValue,
    DataDictionary,
)
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.models import User
from django.conf import settings
from django.core import serializers
from django.db.models.functions import Concat
from django.db.models import CharField, Value as V
from django.forms.models import model_to_dict

import coconnect
from coconnect.tools.omop_db_inspect import OMOPDetails


class ServiceTests(TestCase):
    def test_process_scan_report_sheet_table(self):

        # Tell it what file you want to process
        filename = "/api/mapping/data/value_frequency_test_data.csv"

        # Run the test on filename
        # This function is in services.py
        result = process_scan_report_sheet_table(filename)

        self.assertIs(4, len(result))

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
    # Returns a pandas df of entities, codes and their associated vocabs
    def test_nlp(self):

        user = User.objects.get_or_create(username="testuser")[0]

        data_partner = DataPartner.objects.create(name="UoN")

        sr = ScanReport.objects.create(
            data_partner=data_partner,
            author=user,
            name="Foobar",
            dataset="Dataset A",
            file=SimpleUploadedFile(
                "best_file_eva.txt",
                b"these are the file contents!",  # note the b in front of the string [bytes]
            ),
        )

        srt = ScanReportTable.objects.create(scan_report=sr, name="Occupation")

        srf = ScanReportField.objects.create(
            scan_report_table=srt,
            name="Symptoms",
            description_column="Symptoms that patient has experienced",
            type_column="VARCHAR",
            max_length=32,
            nrows=1,
            nrows_checked=1,
            fraction_empty=50.85,
            nunique_values=100,
            fraction_unique=12.5,
            ignore_column=False,
            is_patient_id=False,
            is_date_event=False,
            is_ignore=False,
            classification_system=None,
            date_type="DOB",
            concept_id=None,
        )

        srv1 = ScanReportValue.objects.create(
            scan_report_field=srf, value="Fever and headache", frequency=5, conceptID=-1
        )

        srv2 = ScanReportValue.objects.create(
            scan_report_field=srf, value="Headache", frequency=5, conceptID=-1
        )

        srv3 = ScanReportValue.objects.create(
            scan_report_field=srf, value="Janitor", frequency=5, conceptID=-1
        )

        srv4 = ScanReportValue.objects.create(
            scan_report_field=srf, value="Joint pain", frequency=5, conceptID=-1
        )

        srv5 = ScanReportValue.objects.create(
            scan_report_field=srf, value="Janitor", frequency=5, conceptID=-1
        )

        DataDictionary.objects.create(
            source_value=srv1,
            dictionary_table="PatientSymptoms",
            dictionary_field="Symptom",
            dictionary_field_description="What symptom the patient is experiencing",
            dictionary_value_code="Yes",
            dictionary_value_description="Fever",
            definition_fixed=True,
        )

        DataDictionary.objects.create(
            source_value=srv2,
            dictionary_table="PatientSymptoms",
            dictionary_field="Symptom",
            dictionary_field_description="What symptom the patient is experiencing",
            dictionary_value_code="Yes",
            dictionary_value_description="Headache",
            definition_fixed=True,
        )

        DataDictionary.objects.create(
            source_value=srv3,
            dictionary_table="PatientSymptoms",
            dictionary_field="Symptom",
            dictionary_field_description="What symptom the patient is experiencing",
            dictionary_value_code="Yes",
            dictionary_value_description="Sore throat",
            definition_fixed=True,
        )

        DataDictionary.objects.create(
            source_value=srv4,
            dictionary_table="PatientSymptoms",
            dictionary_field="Symptom",
            dictionary_field_description="What symptom the patient is experiencing",
            dictionary_value_code="Yes",
            dictionary_value_description="Joint pain",
            definition_fixed=True,
        )

        DataDictionary.objects.create(
            source_value=srv4,
            dictionary_table="Occupation",
            dictionary_field="Occupation",
            dictionary_field_description="Staff member occupation",
            dictionary_value_code="Yes",
            dictionary_value_description="Janitor",
            definition_fixed=True,
        )

        qs = DataDictionary.objects.all()

        # Create a concat field for NLP to work from
        # V is imported from models, used to comma separate other fields
        qs = qs.annotate(
            nlp_string=Concat(
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

        print(for_json)

        # Translate queryset into JSON-like dict for NLP
        documents = []
        for row in for_json:
            documents.append({"language": "en", "id": row[0], "text": row[3]})

        print(documents)

        # Define NLP URL/headers
        url = "https://ccnett2.cognitiveservices.azure.com/text/analytics/v3.1-preview.3/entities/health/jobs?stringIndexType=TextElements_v8"
        headers = {
            "Ocp-Apim-Subscription-Key": os.environ.get("NLP_API_KEY"),
            "Content-Type": "application/json; utf-8",
        }

        # POST Request(s)
        # Short wait at end of submission to let the API catch up
        chunk_size = 2  # Set chunk size (max=10)
        post_response_url = []
        for i in range(0, len(documents), chunk_size):
            chunk = {"documents": documents[i : i + chunk_size]}
            print(chunk)
            payload = json.dumps(chunk)
            response = requests.post(url, headers=headers, data=payload)
            print(response.status_code, response.reason)
            post_response_url.append(response.headers["operation-location"])
            time.sleep(5)

        # GET the response
        get_response = []
        for url in post_response_url:

            print("PROCESSING JOB >>>", url)
            req = requests.get(url, headers=headers)
            job = req.json()

            while job["status"] == "notStarted":
                req = requests.get(url, headers=headers)
                job = req.json()
                print("Waiting...")
                time.sleep(3)
            else:
                get_response.append(job["results"])
                print("Completed! \n")

        codes = []
        keep = ["ICD9", "ICD10", "SNOMEDCT_US"]

        # Mad nested for loops to get at the data in the response
        for url in get_response:
            for dict_entry in url["documents"]:
                for entity in dict_entry["entities"]:
                    if "links" in entity.keys():
                        for link in entity["links"]:
                            if link["dataSource"] in keep:
                                codes.append(
                                    [
                                        dict_entry["id"],
                                        entity["text"],
                                        entity["category"],
                                        entity["confidenceScore"],
                                        link["dataSource"],
                                        link["id"],
                                    ]
                                )

        codes_df = pd.DataFrame(
            codes, columns=["key", "entity", "category", "confidence", "vocab", "code"]
        )
        print("CODES FROM NLP >>>>> \n", codes_df)
        return codes_df

    def test_get_omop(self):

        # Load in OMOPDetails class from Co-Connect Tools
        omop_lookup = OMOPDetails()

        # Load in test_nlp() method to generate a test dataframe
        # of NLP entities for looking up standard codes
        # This bit can take 20 seconds or so to run
        test_nlp_data = ServiceTests.test_nlp(self)

        # This block looks up each concept *code* and returns
        # OMOP standard codes
        results = []
        for index, row in test_nlp_data.iterrows():
            results.append(omop_lookup.lookup_code(row["code"]))

        # Stick all the results together, remove some unnecessary columns
        full_results = pd.concat(results, ignore_index=True).drop(
            [
                "valid_start_date",
                "valid_end_date",
                "invalid_reason",
                "relationship_id",
            ],
            axis=1,
        )
        full_results = test_nlp_data.merge(
            full_results, left_on="code", right_on="concept_code"
        )
        print("RESULTS >>>>> \n", full_results)

    # Small test to check that co-connect tools is successfully looking up
    # and converting Vocab codes into OMOP conceptIDs
    def test_omop(self):

        # Some test concept *codes*
        dat = ["R50.9", "386661006", "R51", "25064002"]

        # Load in OMOPDetails class from Co-Connect Tools
        omop_lookup = OMOPDetails()

        # This block looks up each concept *code* and returns
        # OMOP standard codes
        results = []
        for i in dat:
            results.append(omop_lookup.lookup_code(i))

        full_results = pd.concat(results, ignore_index=True)
        print(full_results)

    def test_nlp_single_string(self):
        """
        This test method checks that the Azure Cognitive Services API
        returns a 13-column, 3-row pandas dataframe for "headache"
        """
        x = nlp_single_string(dict_string="the patient has a headache")
        y = pd.read_csv("/data/tests/nlp_single_string_testdata.csv")
        assert (x, y)
