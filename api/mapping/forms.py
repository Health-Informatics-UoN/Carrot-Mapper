from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from mapping.models import OmopTable, OmopField, DocumentType, DataPartner, Document, OPERATION_CHOICES


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


class AddMappingRuleForm(forms.Form):
    omop_table = forms.ModelChoiceField(
        label="OMOP Table",
        queryset=OmopTable.objects.all(),
        widget=forms.Select(attrs={"class": "form-control"}),
    )

    omop_field = forms.ModelChoiceField(
        label="OMOP Field",
        queryset=OmopField.objects.all(),
        widget=forms.Select(attrs={"class": "form-control"}),
    )

    operation = forms.ChoiceField(
        label='Operation',
        choices=OPERATION_CHOICES,
        widget=forms.Select(attrs={"class": "form-control"}),
    )

    custom = forms.CharField(
        label='Custom SQL',
        required=False,
        widget=forms.Textarea(attrs={"class": "form-control"})
    )   
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["omop_field"].queryset = OmopField.objects.none()

        if "omop_table" in self.data:
            try:
                omop_table_id = int(self.data.get("omop_table"))
                self.fields["omop_field"].queryset = OmopField.objects.filter(
                    table_id=omop_table_id
                ).order_by("field")
            except (ValueError, TypeError):
                pass  # invalid input from the client; ignore and fallback to empty City queryset
        # elif self.instance.pk:
        #     self.fields['omop_field'].queryset = self.instance.omop_table.omop_field_set.order_by('field')


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
    )
    new_password2 = forms.CharField(
        label=("Confirm New password"),
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
    )

    def clean_old_password(self):
        old_password = self.cleaned_data["old_password"]
        if not self.user.check_password(old_password):
            raise ValidationError(
                self.error_messages["password_incorrect"],
                code="password_incorrect",
            )
        return old_password


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


class DocumentFileForm(forms.Form):

    document_file = forms.FileField(
        label="Document", widget=forms.FileInput(attrs={"class": "form-control"})
    )
    document = forms.ModelChoiceField(label="Document", queryset=Document.objects.all())
    description = forms.CharField(
        label="Document Description",
        widget=forms.TextInput(attrs={"class": "form-control"}),
    )
