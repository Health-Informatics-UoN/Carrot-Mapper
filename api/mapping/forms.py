from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from django.core.exceptions import ValidationError

from mapping.models import OmopTable, OmopField,DocumentType,DataPartners


class ScanReportForm(forms.Form):

    data_partner = forms.CharField(
        label="Data Partner name",
        widget=forms.TextInput(
            attrs={'class': 'form-control'}
        )
    )
    dataset = forms.CharField(
        label="Dataset name",
        widget=forms.TextInput(
            attrs={'class': 'form-control'}
        )
    )
    scan_report_file = forms.FileField(
        label="WhiteRabbit ScanReport",
        widget=forms.FileInput(
            attrs={'class': 'form-control'}
        )
    )


class AddMappingRuleForm(forms.Form):

    omop_table = forms.ModelChoiceField(
        label='OMOP Table',
        queryset=OmopTable.objects.all()
    )

    omop_field = forms.ModelChoiceField(
        label='OMOP Field',
        queryset=OmopField.objects.all()
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['omop_field'].queryset = OmopField.objects.none()

        if 'omop_table' in self.data:
            try:
                omop_table_id = int(self.data.get('omop_table'))
                self.fields['omop_field'].queryset = OmopField.objects.filter(table_id=omop_table_id).order_by('field')
            except (ValueError, TypeError):
                pass  # invalid input from the client; ignore and fallback to empty City queryset
        # elif self.instance.pk:
        #     self.fields['omop_field'].queryset = self.instance.omop_table.omop_field_set.order_by('field')


class UserCreateForm(UserCreationForm):
    email = forms.EmailField(required=True,
                            label='Email',
                            error_messages={'exists': 'Oops'})

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
            if User.objects.filter(email=self.cleaned_data['email']).exists():
                raise ValidationError(self.fields['email'].error_messages['exists'])
            return self.cleaned_data['email']

class DocumentForm(forms.Form):
    data_partner = forms.ModelChoiceField(
        label="Data Partner name",
        queryset=DataPartners.objects.all()

    )
    document_type = forms.ModelChoiceField(
        label="Document Type",
        queryset=DocumentType.objects.all()
    )
    document_file = forms.FileField(
        label="Document",
        widget=forms.FileInput(
            attrs={'class': 'form-control'}
        )
    )
    description = forms.CharField(
        label="Document Description",
        widget=forms.TextInput(
            attrs={'class': 'form-control'}
        )
    )
