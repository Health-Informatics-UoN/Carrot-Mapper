
import os
import pandas as pd
from django.contrib import messages
from .models import DataDictionary, DocumentFile, ScanReport

def merge_external_dictionary(request,scan_report_pk):
    
    # Grab the appropriate data dictionary which is built when a scan report is uploaded
    dictionary = (
        DataDictionary.objects.filter(
            source_value__scan_report_field__scan_report_table__scan_report__id=scan_report_pk
        )
        .filter(source_value__scan_report_field__is_patient_id=False)
        .filter(source_value__scan_report_field__is_date_event=False)
        .filter(source_value__scan_report_field__is_ignore=False)
        .exclude(source_value__value="List truncated...")
    )

    # Convert QuerySet to dataframe
    dict_df = pd.DataFrame.from_dict(
        dictionary.values(
            "source_value__scan_report_field__scan_report_table__scan_report__data_partner__name",
            "source_value__scan_report_field__scan_report_table__scan_report__dataset",
            "source_value__scan_report_field__scan_report_table__name",
            "source_value__scan_report_field__name",
            "source_value__value",
            "source_value__frequency",
            "dictionary_field_description",
            "dictionary_value_description",
        )
    )

    # Name columns
    dict_df.columns = [
        "DataPartner",
        "DataSet",
        "Table",
        "Field",
        "Value",
        "Frequency",
        "FieldDesc",
        "ValueDescription",
    ]

    # There's no direct link in our models between an uploaded Document/File and a ScanReport
    # So, first grab the DataPartner value for the ScanReport ID (i.e. the search term)
    scan_report_data_partner = ScanReport.objects.filter(id=scan_report_pk).values(
        "data_partner"
    )

    # Return only those document files where the data partner matches scan_report_data_partner
    # Filter to return only LIVE data dictionaries

    files = (
        DocumentFile.objects.filter(document__data_partner__in=scan_report_data_partner)
        .filter(document__document_type__name="Data Dictionary")
        .filter(status="LIVE")
        .values_list("document_file", flat=True)
    )
    files = list(files)

    if len(files) == 1:

        # Load in uploaded data dictionary for joining (From the Documents section of the webapp)
        external_dictionary = pd.read_csv(os.path.join("media/", files[0]))

        # Create an intermediate join table
        # This ensures that each field in scan_report has a field description from the external dictionary
        field_join = pd.merge(
            dict_df,
            external_dictionary,
            how="left",
            left_on="Field",
            right_on="FieldName",
        )
        
        field_join_grp = field_join.groupby(["Field", "Value_x"]).first().reset_index()

        field_join_grp = field_join_grp[
            ["Table", "Field", "Value_x", "Frequency", "FieldDesc", "FieldDescription"]
        ]

        field_join_grp.to_csv("/data/TEMP_field_join_output.csv")

        # Join the intermediate join back to the external dictionary
        # This time on field and value
        x = pd.merge(
            field_join_grp,
            external_dictionary,
            how="left",
            left_on=["Field", "Value_x"],
            right_on=["FieldName", "Value"],
        )

        x = x[
            [
                "Table",
                "Field",
                "Value_x",
                "Frequency",
                "FieldDesc",
                "TableName",
                "FieldName",
                "FieldDescription_x",
                "Value",
                "ValueDescription",
            ]
        ]
        x=x.fillna(value="")
        x.columns = [
            "Source_Table",
            "Source_Field",
            "Source_Value",
            "Source_Frequency",
            "Source_FieldDesc",
            "Dictionary_TableName",
            "Dictionary_FieldName",
            "Dictionary_FieldDesc",
            "Dictionary_Value",
            "Dictionary_ValueDescription",
        ]

        # If data are missing from imported dictionary
        # replace with analagous descriptions to flesh out dictionary for Usagi
        bad_index = x["Dictionary_ValueDescription"].isnull()
        x["Dictionary_ValueDescription"][bad_index] = x["Dictionary_Value"][
            bad_index
        ]

        bad_index = x["Source_FieldDesc"].isnull()
        x["Source_FieldDesc"][bad_index] = x["Source_Field"][bad_index]

        for index, row in x.iterrows():

            print(row["Source_Field"])
            print(row["Source_Value"])

            obj = DataDictionary.objects.get(
                source_value__scan_report_field__name=row["Source_Field"],
                source_value__value=row["Source_Value"],
            )

            print(type(obj))

            # If user has fixed the definition in the webapp
            # don't overwrite the held definition with the external dictionary values
            if obj.definition_fixed:
                continue

            else:
                obj.dictionary_table = row["Dictionary_TableName"]
                obj.dictionary_field = row["Dictionary_FieldName"]
                obj.dictionary_field_description = row["Dictionary_FieldDesc"]
                obj.dictionary_value = row["Dictionary_Value"]
                obj.dictionary_value_description = row["Dictionary_ValueDescription"]
                obj.save()
                
        messages.success(request, "Merge was successful")

    elif len(files) > 1:
        messages.warning(
            request,
            "There are currently more than 1 data dictionaries set as 'Live'. Please ensure only 1 dictionary is set to 'Live' to proceed.",
        )
        
        return request

    elif len(files) == 0:
        messages.warning(
            request,
            "There are data dictionaries available for this data partner, but none of them are set to 'Live'. Please set a dictionary to 'Live'.",
        )
        
        return request
    
    return request
