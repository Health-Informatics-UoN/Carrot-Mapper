import csv
from django import forms
from django.contrib.auth import password_validation
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.forms.models import ModelChoiceField, ModelForm

from mapping.models import (DataPartner, Document,
                            DocumentFile, DocumentType, FLAG_CHOICES, OmopField, OmopTable,
                            ScanReportField, VOCABULARY_CHOICES)
from xlsx2csv import Xlsx2csv
import openpyxl
from io import BytesIO


class ShowNameChoiceField(ModelChoiceField):
    def label_from_instance(self, obj):
        if obj.__class__.__name__=='Document':
            return str(obj.data_partner.name)
        return obj.name


class ScanReportForm(forms.Form):
    data_partner = ShowNameChoiceField(
        label="Data Partner",
        queryset=DataPartner.objects.order_by('name'),
        widget=forms.Select(attrs={"class": "form-control"}),
    )
    dataset = forms.CharField(
        label="Dataset name", widget=forms.TextInput(attrs={"class": "form-control"})
    )
    scan_report_file = forms.FileField(
        label="WhiteRabbit ScanReport",
        widget=forms.FileInput(attrs={"class": "form-control"}),
    )
    def clean_scan_report_file(self):
        if str(self.cleaned_data['scan_report_file']).endswith('.xlsx'):

            file_in_memory = self.cleaned_data['scan_report_file'].read()
            wb = openpyxl.load_workbook(filename=BytesIO(file_in_memory), data_only = True)
            ws=wb.worksheets[0]

            source_headers = []
            for values in ws[1]: 
                source_headers.append(values.value)

            target_headers=['Table', 'Field', 'Description', 'Type', 'Max length', 'N rows', 'N rows checked', 'Fraction empty', 'N unique values', 'Fraction unique', 'Flag', 'Classification']
            if set(source_headers) == set(target_headers):
                
                flag_column_data = []
                for cell in ws['K']: 
                    if cell.value is None:
                        flag_column_data.append(cell.value)
                    else:
                        flag_column_data.append(cell.value.upper())
                
                flag_column_data.pop(0)
                print(flag_column_data)
                
                classification_column_data = []
                for cell in ws['L']: 
                    if cell.value is None:
                        classification_column_data.append(cell.value)
                    else:
                        classification_column_data.append(cell.value.upper())

                classification_column_data.pop(0)

                allowed_flags = ['PATIENTID', 'DATE', 'IGNORE', 'PASS_SOURCE']
                allowed_classifications = ['SNOMED', 'RXNORM', 'ICD9', 'ICD10']

                if all(x in allowed_flags for x in list(filter(None, flag_column_data))):
                    pass
                else:
                    raise (forms.ValidationError("Check 'Flag' column values. Valid options are " + ', '.join(allowed_flags)))

                if all(x in allowed_classifications for x in list(filter(None, classification_column_data))):
                    pass
                else:
                    raise (forms.ValidationError("Check 'Classification' column values. Valid options are " + ', '.join(allowed_classifications)))
            else:
                raise (forms.ValidationError( "Please check the following columns exist in the Scan Report (Field Overview sheet): Table, Field, Description, Type, Max length, N rows, N rows checked, Fraction empty, N unique values, Fraction unique, Flag, Classification."))
        else:
            raise (forms.ValidationError( "The file you attempted to upload has an unsupported file extension. Please upload an Excel (.xlsx) file."))


class UserCreateForm(UserCreationForm):
    email = forms.EmailField(
        required=True, label="Email", error_messages={"exists": "Oops"}
    )

    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")

    def save(self, commit=True):
        user = super(UserCreateForm, self).save(commit=False)
        user.email = self.cleaned_data["email"]
        if commit:
            user.save()
        return user

    def clean_email(self):
        if User.objects.filter(email=self.cleaned_data["email"]).exists():
            raise ValidationError(self.fields["email"].error_messages["exists"])
        return self.cleaned_data["email"]


class PasswordChangeForm(forms.Form):
    old_password = forms.CharField(
        label="Old Password",
        widget=forms.PasswordInput(
            attrs={"autocomplete": "current-password", "autofocus": True}
        ),
    )
    new_password1 = forms.CharField(
        label=("New password"),
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
        validators=[password_validation.validate_password]

    )

    new_password2 = forms.CharField(
        label=("Confirm New password"),
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
        validators=[password_validation.validate_password]
    )


class DocumentForm(forms.Form):
    
    data_partner = ShowNameChoiceField(
        label="Data Partner",
        queryset=DataPartner.objects.order_by("name"),
        widget=forms.Select(attrs={"class": "form-control"}),
    )

    document_type = ShowNameChoiceField(
        label="Type",
        queryset=DocumentType.objects.order_by("name"),
        widget=forms.Select(attrs={"class": "form-control"}),
    )

    description = forms.CharField(
        label="Description", widget=forms.TextInput(attrs={"class": "form-control"})
    )

    document_file = forms.FileField(
        label="File", widget=forms.FileInput(attrs={"class": "form-control"})
    )

    def clean_document_file(self):
        if str((self.cleaned_data['document_type']).name).lower()=='data dictionary':
            try:
                data_dictionary_csv = self.cleaned_data['document_file'].read().decode("utf-8-sig").splitlines()[0]
                header = data_dictionary_csv.split(',')
                column_names = ["TableName", "FieldName", "FieldDescription", "Value", "ValueDescription"]

                if set(column_names) == set(header):
                    return self.cleaned_data['document_file']
                else:
                    raise (forms.ValidationError("Please check your column names in your data dictionary"))
            except: 
                raise (forms.ValidationError("Data Dictionary must be .csv file"))
        else:
            return self.cleaned_data['document_file']


class DocumentFileForm(forms.Form):
    document_file = forms.FileField(
        label="Document File", widget=forms.FileInput(attrs={"class": "form-control"})
    )
    document_type = ShowNameChoiceField(
        label="Type",
        queryset=DocumentType.objects.order_by("name"),
        widget=forms.Select(attrs={"class": "form-control"}),
    )
    description = forms.CharField(
        label="Document Description",
        widget=forms.TextInput(attrs={"class": "form-control"}),
    )

    def clean_document_type(self):
        print(self.cleaned_data['document_type'].name)
        if str((self.cleaned_data['document_type']).name).lower()=='data dictionary':
            try:
                data_dictionary_csv = self.cleaned_data['document_file'].read().decode("utf-8-sig").splitlines()[0]
                header = data_dictionary_csv.split(',')
                column_names = ["TableName", "FieldName", "FieldDescription", "Value", "ValueDescription"]

                if set(column_names) == set(header):
                    return self.cleaned_data['document_file']
                else:
                    raise (forms.ValidationError("Please check your column names in your data dictionary"))
            except: 
                raise (forms.ValidationError("Data Dictionary must be .csv file"))
        else:
            return self.cleaned_data['document_file']
      
        
class DictionarySelectForm(forms.Form):
    document = forms.ModelChoiceField(label="Data Dictionary Document",
                                      queryset=DocumentFile.objects.filter(status__icontains="LIVE"),
                                      to_field_name="document")


class ScanReportAssertionForm(forms.Form):
    negative_assertion=forms.CharField(
         label="Negative Assertions",
         widget=forms.TextInput(attrs={"class": "form-control"}),
     )    


class NLPForm(forms.Form):
    user_string = forms.CharField(
        label = ""
    )


class ScanReportFieldConceptForm(forms.Form):
    scan_report_field_id=forms.IntegerField(

    )

    concept_id=forms.IntegerField(

    )


class ScanReportValueConceptForm(forms.Form):
    scan_report_value_id=forms.IntegerField(

    )

    concept_id=forms.IntegerField(

    )


class ScanReportFieldForm(forms.ModelForm):
    class Meta:
        model = ScanReportField
        fields = (
            #"is_patient_id",
            #"is_date_event",
            "is_ignore",
            "pass_from_source",
            "description_column"
            )
        widgets = {
            'description_column': forms.TextInput(attrs={
            'class': u'form-control'})
        }
