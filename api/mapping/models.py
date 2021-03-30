import os
from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.db.models.constraints import UniqueConstraint


STATUS_LIVE='LIVE'
STATUS_ARCHIVED='ARCHIVED'
STATUS_CHOICES = [
    (STATUS_LIVE, 'Live'),
    (STATUS_ARCHIVED, 'Archived'),
]

OPERATION_NONE = 'NONE'
OPERATION_EXTRACT_YEAR = 'EXTRACT_YEAR'

from coconnect.cdm.operations import OperationTools

allowed_operations = [
    (x,x)
    for x in dir(OperationTools)
    if x.startswith("get") and callable(getattr(OperationTools,x))
]

OPERATION_CHOICES = [
    (OPERATION_NONE, 'No operation'),
]
OPERATION_CHOICES.extend(allowed_operations)


from coconnect.tools.omop_db_inspect import OMOPDetails
df_omop = OMOPDetails.to_df()
DATE_TYPE_CHOICES = df_omop[df_omop['field'].str.contains('datetime')]['field'].tolist()
DATE_TYPE_CHOICES = [ (x,x) for x in DATE_TYPE_CHOICES]


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Source(BaseModel):
    """
    DEFINE MODEL TO HOLD INFORMATION ON THE SOURCE DATA TABLES AND COLUMNS
    """
    dataset = models.CharField(max_length=64)
    table = models.CharField(max_length=64)
    field = models.CharField(max_length=64)
    mapping = models.ManyToManyField('Mapping')

    class Meta:
        db_table = 'source'
        verbose_name = 'Source'
        verbose_name_plural = 'Sources'

    def __str__(self):
        return f'{self.dataset, self.table, self.field}'


class Mapping(BaseModel):
    """
    DEFINE MODEL TO HOLD THE POSSIBLE OMOP MAPPING COMBINATIONS
    """
    table = models.CharField(max_length=64)
    field = models.CharField(max_length=64)

    class Meta:
        db_table = 'mapping'
        verbose_name = 'Mapping'
        verbose_name_plural = 'Mappings'

    def __str__(self):
        return f'{self.table, self.field}'


class ClassificationSystem(BaseModel):
    """
    Class for 'classification system', i.e. SNOMED or ICD-10 etc.
    """

    name = models.CharField(max_length=64)  # 128?

    def __str__(self):
        return self.name


class DataPartner(BaseModel):
    name = models.CharField(max_length=64)

    class Meta:
        db_table = 'datapartner'
        verbose_name = 'Data Partner'
        verbose_name_plural = 'Data Partners'
        constraints = [
            UniqueConstraint(
                fields=['name'],
                name='datapartner_name_unique',
            )
        ]

    def __str__(self):
        return self.name


# Models for rule mapping
class OmopTable(BaseModel):
    table = models.CharField(max_length=64)

    def __str__(self):
        return self.table


class OmopField(BaseModel):
    table = models.ForeignKey(OmopTable, on_delete=models.CASCADE)
    field = models.CharField(max_length=64)

    
    def __str__(self):
        return f'{self.table, self.field}'

    
class DocumentType(BaseModel):
    name = models.CharField(max_length=64)

    class Meta:
        db_table = 'documenttype'
        verbose_name = 'Document Type'
        verbose_name_plural = 'Document Types'
        constraints = [
            UniqueConstraint(
                fields=['name'],
                name='documenttype_name_unique',
            )
        ]

    def __str__(self):
        return self.name


class ScanReport(BaseModel):

    data_partner = models.ForeignKey(
        DataPartner,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        blank=True,
        null=True
    )
    name = models.CharField(
        max_length=256
    )
    dataset = models.CharField(
        max_length=128
    )
    file = models.FileField(

    )

    def __str__(self):
        return f'#{self.id, self.dataset}'


class ScanReportTable(BaseModel):
    scan_report = models.ForeignKey(ScanReport, on_delete=models.CASCADE)
    name = models.CharField(max_length=256)

    def __str__(self):
        return self.name


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
    ignore_column=models.CharField(max_length=64,blank=True,null=True)
    is_patient_id = models.BooleanField(default=False)
    is_date_event = models.BooleanField(default=False)

    
    
    is_ignore = models.BooleanField(default=False)
    pass_from_source = models.BooleanField(null=True,blank=True)


    classification_system = models.CharField(max_length=64, blank=True, null=True)


    date_type = models.CharField(
       max_length=128,
       choices=DATE_TYPE_CHOICES,
       default="",
       null=True,
       blank=True
    )

    concept_id = models.IntegerField(default=-1,null=True,blank=True) 
    
    def __str__(self):
        return self.name


class ScanReportAssertion(BaseModel):

    scan_report=models.ForeignKey(
        ScanReport,
        on_delete=models.CASCADE
    )
    negative_assertion=models.CharField(max_length=64)

    def __str__(self):
        return f'{self.scan_report, self.negative_assertion}'


class StructuralMappingRule(BaseModel):
    
    scan_report = models.ForeignKey(
        ScanReport,
        on_delete=models.CASCADE
    )
    
    omop_field = models.ForeignKey(
        OmopField,
        on_delete=models.CASCADE
    )
 
    source_table = models.ForeignKey(
        ScanReportTable,
        on_delete=models.CASCADE,
        blank=True,
        null=True
    )

    source_field = models.ForeignKey(
        ScanReportField,
        on_delete=models.CASCADE,
        blank=True,
        null=True
        #limit_choices_to= {'scan_report_table': source_table}
    )

    term_mapping = models.CharField(
        max_length=10000,
        blank=True,
        null=True
    )

    approved = models.BooleanField(default=False)
   

    def __str__(self):
        return f'{self.term_mapping}'

    

# class MappingRule(BaseModel):
#     omop_field = models.ForeignKey(
#         OmopField,
#         on_delete=models.CASCADE
#     )

#     scan_report_field = models.ForeignKey(
#         ScanReportField,
#         on_delete=models.CASCADE
#     )

#     operation = models.CharField(
#         max_length=32,
#         choices=OPERATION_CHOICES,
#         default=OPERATION_NONE,
#     )
#     def __str__(self):
#         return f'{self.omop_field, self.scan_report_field}'


class ScanReportValue(BaseModel):
    scan_report_field = models.ForeignKey(ScanReportField, on_delete=models.CASCADE)
    value = models.CharField(max_length=128)
    frequency = models.IntegerField()
    conceptID = models.IntegerField(default=-1)  # TODO rename it to concept_id

    
    
    def __str__(self):
        return self.value


class Document(BaseModel):
    data_partner = models.ForeignKey(

        DataPartner,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )

    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )

    description = models.CharField(
        max_length=256,
    )

    def __str__(self):

        return f'{self.data_partner, self.document_type}'


class DocumentFile(BaseModel):
    document_file=models.FileField()
    size=models.IntegerField()
    document=models.ForeignKey(
            Document,
            on_delete=models.CASCADE,
            blank=True,
            null=True)
    status=models.CharField(max_length=20,choices=STATUS_CHOICES,default=STATUS_ARCHIVED)

    def __str__(self):
        self.document_file.name = os.path.basename(self.document_file.name)

        # return f'{self.document_file,self.size,self.created_at,self.document_file.name,self.status}'
        return f'{self.document_file, self.status}'


class DataDictionary(BaseModel):

    source_value = models.ForeignKey(ScanReportValue, on_delete=models.CASCADE)
    dictionary_table = models.CharField(max_length=128, blank=True, null=True)
    dictionary_field = models.CharField(max_length=128, blank=True, null=True)
    dictionary_field_description = models.TextField(blank=True, null=True)
    dictionary_value_code = models.CharField(max_length=128, blank=True, null=True)
    dictionary_value_description = models.TextField(blank=True, null=True)
    definition_fixed = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.source_value, self.dictionary_table, self.dictionary_field, self.dictionary_field_description, self.dictionary_value_code, self.dictionary_value_description, self.definition_fixed}'

