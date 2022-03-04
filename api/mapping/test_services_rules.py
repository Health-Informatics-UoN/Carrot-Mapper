import os
from ssl import ALERT_DESCRIPTION_DECOMPRESSION_FAILURE
from typing import Mapping
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from data.models import ConceptAncestor, Concept
from .services_rules import analyse_concepts, get_concept_details
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.authtoken.models import Token
from .views import DatasetListView
from .models import (
    DataPartner,
    MappingRule,
    OmopField,
    OmopTable,
    Project,
    Dataset,
    ScanReport,
    ScanReportConcept,
    ScanReportField,
    ScanReportTable,
    ScanReportValue,
)


class TestMisalignedMappings(TestCase):
    def setUp(self):
        # Create User
        User = get_user_model()
        self.user1 = User.objects.create(username="oliver", password="uhafcvbsyrgf")
        # Generate Token for the user
        Token.objects.create(user=self.user1)
        # Create Dataser
        self.data_partner = DataPartner.objects.create(name="Data Partner")
        self.dataset1 = Dataset.objects.create(
            name="Dataset", visibility="PUBLIC", data_partner=self.data_partner
        )
        # Allow user to view dataset
        # self.dataset1.viewers.add(self.user1)
        # Create Project
        self.project1 = Project.objects.create(name="Project")
        # Add user to project
        self.project1.members.add(self.user1)
        # Add dataset to project
        self.project1.datasets.add(
            self.dataset1,
        )
        # Create Scan Report
        self.scan_report1 = ScanReport.objects.create(
            author=self.user1,
            name="Scan Report",
            dataset="Dataset Name",
            parent_dataset=self.dataset1,
        )
        # Aloow user to view scan report
        self.scan_report1.viewers.add(self.user1)
        # Create Scan Report Table
        self.scan_report_table = ScanReportTable.objects.create(
            scan_report=self.scan_report1, name="Table 1"
        )
        # Create Scan Report ID field
        self.scan_report_field_ID = ScanReportField.objects.create(
            scan_report_table=self.scan_report_table,
            name="ID",
            description_column="",
            type_column="INT",
            max_length=10,
            nrows=-1,
            nrows_checked=557,
            fraction_empty=0.0,
            nunique_values=55,
            fraction_unique=100,
            ignore_column=None,
        )
        # Create Date field
        self.scan_report_field_date = ScanReportField.objects.create(
            scan_report_table=self.scan_report_table,
            name="Date",
            description_column="",
            type_column="VARCHAR",
            max_length=10,
            nrows=-1,
            nrows_checked=557,
            fraction_empty=0.0,
            nunique_values=21,
            fraction_unique=3.8,
            ignore_column=None,
        )
        # Create Cough field
        self.scan_report_field_cough = ScanReportField.objects.create(
            scan_report_table=self.scan_report_table,
            name="Cough",
            description_column="",
            type_column="VARCHAR",
            max_length=4,
            nrows=-1,
            nrows_checked=557,
            fraction_empty=0.0,
            nunique_values=3,
            fraction_unique=0.5,
            ignore_column=None,
        )
        # Create Arrythmia field
        self.scan_report_field_arrythmia = ScanReportField.objects.create(
            scan_report_table=self.scan_report_table,
            name="Arrythmia",
            description_column="",
            type_column="VARCHAR",
            max_length=4,
            nrows=-1,
            nrows_checked=557,
            fraction_empty=0.0,
            nunique_values=3,
            fraction_unique=0.5,
            ignore_column=None,
        )
        # Create Cough field values, Y & N
        self.scan_report_value_Y = ScanReportValue.objects.create(
            value="Y",
            frequency=34,
            value_description="",
            scan_report_field=self.scan_report_field_cough,
        )
        self.scan_report_value_N = ScanReportValue.objects.create(
            value="N",
            frequency=25,
            value_description="",
            scan_report_field=self.scan_report_field_cough,
        )
        # Create Arrythmia values, Y & N
        self.scan_report_value_Y2 = ScanReportValue.objects.create(
            value="Y",
            frequency=34,
            value_description="",
            scan_report_field=self.scan_report_field_arrythmia,
        )
        self.scan_report_value_N2 = ScanReportValue.objects.create(
            value="N",
            frequency=25,
            value_description="",
            scan_report_field=self.scan_report_field_arrythmia,
        )
        # Set table person_id and date_event to create mapping rules
        self.scan_report_table.person_id = self.scan_report_field_ID
        self.scan_report_table.date_event = self.scan_report_field_date

        self.omop_table1 = OmopTable.objects.create(table="condition")
        self.omop_field1 = OmopField.objects.create(
            table=self.omop_table1, field="condition_concept_id"
        )
        self.concept_cough = Concept.objects.get(concept_id=254761)

        self.content_type = ContentType.objects.get(
            app_label="mapping", model="scanreportvalue"
        )

        self.scan_report_concept_cough = ScanReportConcept.objects.create(
            concept=self.concept_cough,
            content_type=self.content_type,
            object_id=self.scan_report_value_Y.id,
            creation_type="M",
        )
        self.mapping_rule1 = MappingRule.objects.create(
            scan_report=self.scan_report1,
            omop_field=self.omop_field1,
            source_table=self.scan_report_table,
            source_field=self.scan_report_field_cough,
            concept=self.scan_report_concept_cough,
        )

    def test_analyse_concepts(self):
        data = analyse_concepts(self.scan_report1.id)
        test_data = data["data"][0]

        expected_rule_id = self.concept_cough.concept_id
        expected_rule_name = self.concept_cough.concept_name

        self.assertEqual(test_data["rule_id"], expected_rule_id)
        self.assertEqual(test_data["rule_name"], expected_rule_name)

    def test_get_concept_details(self):

        descendants = ConceptAncestor.objects.filter(
            ancestor_concept_id=self.concept_cough.concept_id
        )
        d_list = []
        for d in descendants:
            desc_name, source_ids = get_concept_details(
                self.concept_cough.concept_id, d.descendant_concept_id
            )
            d_list.append(
                {
                    "d_id": d,
                    "d_name": desc_name,
                    "source": source_ids,
                }
            )
        print(d_list)
