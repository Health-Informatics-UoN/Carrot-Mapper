import csv
from django import forms
from django.contrib.auth import password_validation
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

from mapping.models import (OPERATION_CHOICES, DataPartner, Document,
                            DocumentFile, DocumentType, OmopField, OmopTable,
                            ScanReport)
from xlsx2csv import Xlsx2csv


class ScanReportForm(forms.Form):
    data_partner = forms.ModelChoiceField(
        label="Data Partner",
        queryset=DataPartner.objects.order_by("name"),
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
        xlsx = Xlsx2csv(self.cleaned_data['scan_report_file'], outputencoding="utf-8")

        filepath = "/tmp/{}.csv".format(xlsx.workbook.sheets[0]["name"])
        xlsx.convert(filepath)

        with open(filepath, "rt") as f:
            reader = csv.reader(f)
            csv_header=next(reader)  # Get header row
            set_header=['Table', 'Field', 'Description', 'Type', 'Max length', 'N rows', 'N rows checked', 'Fraction empty', 'N unique values', 'Fraction unique', 'Flag', 'Classification']
            if set(set_header)==set(csv_header):
                return self.cleaned_data['scan_report_file']
            else:
                raise (forms.ValidationError( "Please check the following columns exist in the Scan Report: Table, Field, Description, Type, Max length, N rows, N rows checked, Fraction empty, N unique values, Fraction unique, Flag, Classification."))
        
      
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
    data_partner = forms.ModelChoiceField(
        label="Data Partner",
        queryset=DataPartner.objects.order_by("name"),
        widget=forms.Select(attrs={"class": "form-control"}),
    )

    document_type = forms.ModelChoiceField(
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
        data_dictionary_csv = self.cleaned_data['document_file'].read().decode("utf-8-sig").splitlines()[0]
        header = data_dictionary_csv.split(',')
        column_names = ["Table Name", "Column Name", "Column Description", "ValueCode", "ValueDescription"]

        if set(column_names) == set(header):
            return self.cleaned_data['document_file']
        else:
            raise (forms.ValidationError("Please check your column names in your data dictionary"))


class DocumentFileForm(forms.Form):
    document_file = forms.FileField(
        label="Document", widget=forms.FileInput(attrs={"class": "form-control"})
    )
    document = forms.ModelChoiceField(
        label="Document", queryset=Document.objects.all()
    )
    description = forms.CharField(
        label="Document Description",
        widget=forms.TextInput(attrs={"class": "form-control"}),
    )

    def clean_document_file(self):

        data_dictionary_csv = self.cleaned_data['document_file'].read().decode("utf-8-sig").splitlines()[0]
        header = data_dictionary_csv.split(',')
        column_names = ["Table Name", "Column Name", "Column Description", "ValueCode", "ValueDescription"]

        if set(column_names) == set(header):
            return self.cleaned_data['document_file']
        else:
            raise (forms.ValidationError("Please check your column names in your data dictionary"))


class DictionarySelectForm(forms.Form):
    document = forms.ModelChoiceField(label="Data Dictionary Document",
                                      queryset=DocumentFile.objects.filter(status__icontains="Live"),
                                      to_field_name="document")


class ScanReportAssertionForm(forms.Form):
    negative_assertion=forms.CharField(
         label="Negative Assertions",
         widget=forms.TextInput(attrs={"class": "form-control"}),
     )    


class NLPForm(forms.Form):
    user_string = forms.CharField(
        label = "Text"
    )