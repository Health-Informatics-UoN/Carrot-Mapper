from django import forms
from django.contrib.auth.decorators import login_required


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
