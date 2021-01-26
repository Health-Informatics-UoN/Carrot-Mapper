from django.db import models

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
    name = models.CharField(max_length=256)
    file = models.FileField()

    def __str__(self):
        return self.name


class ScanReportFieldOverviewRecord(BaseModel):
    scan_report = models.Foreign(ScanReport)
    table = models.CharField(max_length=256)
    field = models.CharField(max_length=64)
    description_column = models.CharField(max_length=256)
    type_column = models.CharField(max_length=32)
    max_length = models.IntegerField()
    nrows = models.IntegerField()
    nrows_checked = models.IntegerField()
    fraction_empty = models.DecimalField()
    nunique_values = models.IntegerField()
    fraction_unique = models.DecimalField()


class ScanReportValueRecord(BaseModel):
    scan_report_field_overview_records = models.ForeignField(ScanReportFieldOverviewRecord)
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
