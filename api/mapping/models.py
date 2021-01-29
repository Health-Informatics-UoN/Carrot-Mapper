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
    name = models.CharField(max_length=256) # Don't think we need this field
    data_partner = models.CharField(max_length=128)
    dataset = models.CharField(max_length=128)
    file = models.FileField()

    def __str__(self):
        return f'{self.data_partner, self.dataset}'


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

# class UsagiProperties(BaseModel):
#     """
#     Model to hold information on the Usagi input settings
#     """
#     scan_report_field = models.ForeignKey(ScanReportField, on_delete=models.CASCADE)
#     usagiFolder = models.Charfield(max_length=64)
#     vocabFolder = models.Charfield(max_length=64)
#     sourceFile = models.Charfield(max_length=64)
#     mappingFile = models.Charfield(max_length=64)
#     source_code_col = models.Charfield(max_length=64)
#     source_name_col = models.Charfield(max_length=64)
#     positive_answer = models.Charfield(max_length=64)
#     negative_answer = models.Charfield(max_length=64)
#     source_field_code = models.Charfield(max_length=64)
#     source_field_desc = models.Charfield(max_length=64)
#     threshold = models.DecimalField(decimal_places=2, max_digits=10)
#     additional_info_cols = models.Charfield(max_length=64)
#
#     def __str__(self):
#         return f'{self.scan_report_field}'
#
# class UsagiOutput(BaseModel):
#     """
#     Model to hold information on the results of a Usagi run
#     """
#     usagi_properties_file = models.ForeignKey(UsagiProperties, on_delete=models.CASCADE)
#     source_code = models.Charfield(max_length=64)
#     source_name = models.Charfield(max_length=64)
#     source_freq = models.IntegerField()
#     match_score = models.DecimalField(decimal_places=2, max_digits=10)
#     mapping_status = models.Charfield(max_length=64)
#     target_concept_id = models.IntegerField()
#     target_concept_name = models.Charfield(max_length=64)
#     target_vocab_id = models.Charfield(max_length=64)
#     target_domain_id = models.Charfield(max_length=64)
#     target_standard_concept = models.Charfield(max_length=5)
#     target_concept_class = models.Charfield(max_length=64)
#     target_concept_code = models.IntegerField()
#     target_invalid_reason = models.Charfield(max_length=64)


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
