from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

"""
Relationship is many:many because;
Each pair of source data tables/fields can potentially be related to many tables/fields in OMOP
Each pair of tables/fields in OMOP can be related to many different pairs of tables/fields in the source data
"""


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class DataPartners(BaseModel):
    name = models.CharField(max_length=64)

    def __str__(self):
        return self.name


class ScanReport(BaseModel):
    name = models.CharField(max_length=256) # Don't think we need this field
    data_partner = models.CharField(max_length=128)
    dataset = models.CharField(max_length=128)
    file = models.FileField()
    author=models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        blank=True,
        null=True
    )

    def __str__(self):
        return f'{self.data_partner, self.dataset,self.author}'


class ScanReportTable(BaseModel):
    scan_report = models.ForeignKey(ScanReport, on_delete=models.CASCADE)
    name = models.CharField(max_length=256)

    def __str__(self):
        return f'{self.scan_report, self.name}'


class ScanReportField(BaseModel):
    scan_report_table = models.ForeignKey(ScanReportTable, on_delete=models.CASCADE)
    name = models.CharField(max_length=64)
    description_column = models.CharField(max_length=256)
    type_column = models.CharField(max_length=32)
    max_length = models.IntegerField()
    nrows = models.IntegerField()
    nrows_checked = models.IntegerField()
    fraction_empty = models.DecimalField(decimal_places=2, max_digits=10)
    nunique_values = models.IntegerField()
    fraction_unique = models.DecimalField(decimal_places=2, max_digits=10)


class ScanReportValue(BaseModel):
    scan_report_field = models.ForeignKey(ScanReportField, on_delete=models.CASCADE)
    value = models.CharField(max_length=32)
    frequency = models.IntegerField()


class Source(BaseModel):
    """
    DEFINE MODEL TO HOLD INFORMATION ON THE SOURCE DATA TABLES AND COLUMNS
    """
    dataset = models.CharField(max_length=64)
    table = models.CharField(max_length=64)
    field = models.CharField(max_length=64)
    mapping = models.ManyToManyField('Mapping')

    def __str__(self):
        return f'{self.dataset, self.table, self.field}'


class Mapping(BaseModel):
    """
    DEFINE MODEL TO HOLD THE POSSIBLE OMOP MAPPING COMBINATIONS
    """
    table = models.CharField(max_length=64)
    field = models.CharField(max_length=64)

    def __str__(self):
        return f'{self.table, self.field}'
