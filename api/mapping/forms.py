from django import forms
from django.contrib.auth import password_validation
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.forms.models import ModelChoiceField

from mapping.models import (DataPartner,
                            DocumentFile, DocumentType,
                            ScanReportField, ScanReport)
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

    data_dictionary_file = forms.FileField(
        label="Data Dictionary",
        widget=forms.FileInput(attrs={"class": "form-control"}),
        required=False
    )

    class Meta:
        model = ScanReport
        fields = ('data_partner', 'dataset' , 'scan_report_file')

 
    def clean_data_dictionary_file(self):

        data_dictionary = self.cleaned_data.get("data_dictionary_file")
        print(data_dictionary)

        if data_dictionary is None:
            return data_dictionary

        if not str(data_dictionary).endswith('.csv'):
            raise ValidationError( "You have attempted to upload a data dictionary which is not in CSV format. Please upload a .csv file.")
        
        return data_dictionary

    def clean_scan_report_file(self):

        scan_report = self.cleaned_data.get("scan_report_file")

        if not str(scan_report).endswith('.xlsx'):
            raise ValidationError("You have attempted to upload a scan report which is not in XLSX format. Please upload a .xlsx file.")

        # Load in the Excel sheet, grab the first workbook
        file_in_memory = scan_report.read()
        wb = openpyxl.load_workbook(filename=BytesIO(file_in_memory), data_only = True)
        ws=wb.worksheets[0]

        # Grab the scan report columns from the first worksheet
        # Define what the column headings should be
        source_headers = []
        for values in ws[1]: 
            source_headers.append(values.value)

        expected_headers=['Table', 'Field', 'Description', 'Type', 'Max length', 'N rows', 'N rows checked', 'Fraction empty', 'N unique values', 'Fraction unique', 'Flag', 'Classification']
        
        # Check if source headers match the expected headers
        if not source_headers == expected_headers:
            raise ValidationError("Please check the following columns exist in the Scan Report (Field Overview sheet) in this order: Table, Field, Description, Type, Max length, N rows, N rows checked, Fraction empty, N unique values, Fraction unique, Flag, Classification.")

        # Grab the data from the 'Flag' column
        # Set to upper if the call value != None to catch any formatting errors
        flag_column_data = []
        for cell in ws['K']: 
            if cell.value is None:
                flag_column_data.append(cell.value)
            else:
                flag_column_data.append(cell.value.upper())
        
        # Removes the column name (here, 'Flag') from the list of Flag values
        flag_column_data.pop(0)
        
        # Grab the data from the 'Classification' column
        # Set to upper if the call value != None to catch any formatting errors
        classification_column_data = []
        for cell in ws['L']: 
            if cell.value is None:
                classification_column_data.append(cell.value)
            else:
                classification_column_data.append(cell.value.upper())

        # Removes the column name (here, 'Classification') from the list of Flag values
        classification_column_data.pop(0)

        # Define what flags and classifications we allow in respective columns
        allowed_flags = ['PATIENTID', 'DATE', 'IGNORE', 'PASS_SOURCE']
        allowed_classifications = ['SNOMED', 'RXNORM', 'ICD9', 'ICD10']

        # Test whether the values in the flag column are in our list of allowed flags
        if not all(flag in allowed_flags for flag in list(filter(None, flag_column_data))):
            raise ValidationError("Check 'Flag' column values. Valid options are " + ', '.join(allowed_flags))

        # Test whether the values in the classificcation column are in our list of allowed classifications
        if not all(classification in allowed_classifications for classification in list(filter(None, classification_column_data))):
            raise ValidationError("Check 'Classification' column values. Valid options are " + ', '.join(allowed_classifications))

        return scan_report




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
