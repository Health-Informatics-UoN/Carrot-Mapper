"""
To come
"""

from django.conf import settings
from django.db import models
from django.db.models.constraints import UniqueConstraint
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.fields import GenericRelation

from data.models import Concept

STATUS_LIVE = "LIVE"
STATUS_ARCHIVED = "ARCHIVED"
STATUS_CHOICES = [
    (STATUS_LIVE, "Live"),
    (STATUS_ARCHIVED, "Archived"),
]

class BaseModel(models.Model):
    """
    To come
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        abstract = True


class Source(BaseModel):
    """
    DEFINE MODEL TO HOLD INFORMATION ON THE SOURCE DATA TABLES AND COLUMNS
    """

    dataset = models.CharField(
        max_length=64,
    )

    table = models.CharField(
        max_length=64,
    )

    field = models.CharField(
        max_length=64,
    )

    mapping = models.ManyToManyField(
        "Mapping",
    )

    class Meta:
        verbose_name = "Source"
        verbose_name_plural = "Sources"

    def __str__(self):
        return str(self.id)


class Mapping(BaseModel):
    """
    DEFINE MODEL TO HOLD THE POSSIBLE OMOP MAPPING COMBINATIONS
    """

    table = models.CharField(
        max_length=64,
    )

    field = models.CharField(
        max_length=64,
    )

    class Meta:
        verbose_name = "Mapping"
        verbose_name_plural = "Mappings"

    def __str__(self):
        return str(self.id)


class ClassificationSystem(BaseModel):
    """
    Class for 'classification system', i.e. SNOMED or ICD-10 etc.
    """

    name = models.CharField(
        max_length=64,
    )

    def __str__(self):
        return str(self.id)


class DataPartner(BaseModel):
    """
    To come
    """

    name = models.CharField(
        max_length=64,
    )

    class Meta:
        verbose_name = "Data Partner"
        verbose_name_plural = "Data Partners"
        constraints = [
            UniqueConstraint(
                fields=["name"],
                name="datapartner_name_unique",
            )
        ]

    def __str__(self):
        return str(self.id)


class OmopTable(BaseModel):
    """
    To come
    """

    table = models.CharField(
        max_length=64,
    )

    def __str__(self):
        return str(self.id)


class OmopField(BaseModel):
    """
    To come
    """

    table = models.ForeignKey(
        OmopTable,
        on_delete=models.CASCADE,
    )

    field = models.CharField(
        max_length=64,
    )

    def __str__(self):
        return str(self.id)


class DocumentType(BaseModel):
    """
    To come
    """

    name = models.CharField(
        max_length=64,
    )

    class Meta:
        verbose_name = "Document Type"
        verbose_name_plural = "Document Types"
        constraints = [
            UniqueConstraint(
                fields=["name"],
                name="documenttype_name_unique",
            )
        ]

    def __str__(self):
        return str(self.id)


class ScanReportConcept(BaseModel):
    """
    This class stores concepts informed by the user or automatic tools (NLP)
    and users a generic relation to connect it to a ScanReportValue or ScanReportValue
    """
    nlp_entity = models.CharField(
        max_length=64,
        null=True,
        blank=True,
    )

    nlp_entity_type = models.CharField(
        max_length=64,
        null=True,
        blank=True,
    )

    nlp_confidence = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
    )

    nlp_vocabulary = models.CharField(
        max_length=64,
        null=True,
        blank=True,
    )

    nlp_concept_code = models.CharField(
        max_length=64,
        null=True,
        blank=True,
    )

    nlp_processed_string = models.CharField(
        max_length=256,
        null=True,
        blank=True,
    )

    concept = models.ForeignKey(
        Concept,
        on_delete=models.DO_NOTHING,
    )

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
    )

    object_id = models.PositiveIntegerField(

    )

    content_object = GenericForeignKey(

    )

    def __str__(self):
        return str(self.id)


class ScanReport(BaseModel):
    """
    To come
    """

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
        null=True,
    )

    name = models.CharField(
        max_length=256,
    )

    dataset = models.CharField(
        max_length=128,
    )

    hidden =  models.BooleanField(
        default=False,
    )

    file = models.FileField()

    def __str__(self):
        return str(self.id)


class ScanReportTable(BaseModel):
    """
    To come
    """

    scan_report = models.ForeignKey(
        ScanReport,
        on_delete=models.CASCADE,
    )

    name = models.CharField(
        max_length=256,
    )

    #Quick notes:
    # - "ScanReportField", instead of ScanReportField,
    #    because ScanReportField has yet been defined, so you get a crash
    #    Using the quotes to look up via the name, works just fine
    # - related_name needed to be set because of
    #   https://stackoverflow.com/questions/41595364/fields-e304-reverse-accessor-clashes-in-django
    person_id = models.ForeignKey(
        "ScanReportField",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
        related_name = 'person_id'
    )

    date_event = models.ForeignKey(
        "ScanReportField",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
        related_name = 'date_event'
    )
    
    def __str__(self):
        return str(self.id)

class ScanReportField(BaseModel):
    """
    To come
    """

    scan_report_table = models.ForeignKey(
        ScanReportTable,
        on_delete=models.CASCADE,
    )

    name = models.CharField(
        max_length=512,
    )

    description_column = models.CharField(
        max_length=512,
    )

    type_column = models.CharField(
        max_length=32,
    )

    max_length = models.IntegerField()

    nrows = models.IntegerField()

    nrows_checked = models.IntegerField()

    fraction_empty = models.DecimalField(
        decimal_places=2,
        max_digits=10,
    )

    nunique_values = models.IntegerField()

    fraction_unique = models.DecimalField(
        decimal_places=2,
        max_digits=10,
    )

    ignore_column = models.CharField(
        max_length=64,
        blank=True,
        null=True,
    )

    flag_column=models.CharField(
        max_length=64,
        blank=True,
        null=True,
    )
    
    is_patient_id = models.BooleanField(
        default=False,
    )

    is_date_event = models.BooleanField(
        default=False,
    )

    is_birth_date = models.BooleanField(
        default=False,
    )

    is_ignore = models.BooleanField(
        default=False,
    )

    classification_system = models.CharField(
        max_length=64,
        blank=True,
        null=True,
    )

    pass_from_source = models.BooleanField(
        default=False,
    )
    
    DATE_TYPE_CHOICES = []  # TODO Remove it or move it to the top of this file
    
    # This field is no longer used, and will be removed in the future.
    date_type = models.CharField(
        max_length=128, choices=DATE_TYPE_CHOICES, default="", null=True, blank=True
    )

    concept_id = models.IntegerField(
        default=-1,
        blank=True,
        null=True,
        # This field is not used anymore
    )
    
    field_description = models.CharField(
        max_length=256,
        blank=True,
        null=True
    )

    concepts = GenericRelation(
        ScanReportConcept,
    )
    
    def __str__(self):
        return str(self.id)


class ScanReportAssertion(BaseModel):
    """
    To come
    """

    scan_report = models.ForeignKey(
        ScanReport,
        on_delete=models.CASCADE,
    )

    negative_assertion = models.CharField(
        max_length=64,
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.id)


#!! TODO --- Give this model a better name(?)
class StructuralMappingRule(BaseModel):
    """
    To come
    """
    #save the scan_report link to make it easier when performing lookups on scan_report_id
    scan_report = models.ForeignKey(
        ScanReport,
        on_delete=models.CASCADE
    )

    #connect the rule to a destination_field (and therefore destination_table)
    #e.g. condition_concept_id
    omop_field = models.ForeignKey(
        OmopField,
        on_delete=models.CASCADE
    )

    #!! TODO --- STOP USING THIS
    source_table = models.ForeignKey(
        ScanReportTable,
        on_delete=models.CASCADE,
        blank=True,
        null=True
    )
    
    #connect the rule with a source_field (and therefore source_table)
    source_field = models.ForeignKey(
        ScanReportField,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    scan_report_concept = models.ForeignKey(
        ScanReportConcept,
        on_delete=models.CASCADE
    )

    approved = models.BooleanField(default=False)

    def __str__(self):
        return str(self.id)


class ScanReportValue(BaseModel):
    """
    To come
    """

    scan_report_field = models.ForeignKey(
        ScanReportField,
        on_delete=models.CASCADE,
    )

    value = models.CharField(
        max_length=128,
    )

    frequency = models.IntegerField(

    )

    conceptID = models.IntegerField(
        default=-1,
    )  # TODO rename it to concept_id

    concepts = GenericRelation(
        ScanReportConcept,
    )
    
    value_description  = models.CharField(
        max_length=512,
        blank=True,
        null=True
    )

    def __str__(self):
        return str(self.id)


class Document(BaseModel):
    """
    To come
    """

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
        return str(self.id)


class DocumentFile(BaseModel):
    """
    To come
    """

    document_file = models.FileField()

    size = models.IntegerField()

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ARCHIVED,
    )

    def __str__(self):
        return str(self.id)


class DataDictionary(BaseModel):
    """
    To come
    """

    source_value = models.ForeignKey(
        ScanReportValue,
        on_delete=models.CASCADE,
    )

    dictionary_table = models.CharField(
        max_length=128,
        blank=True,
        null=True,
    )

    dictionary_field = models.CharField(
        max_length=128,
        blank=True,
        null=True,
    )

    dictionary_field_description = models.TextField(
        blank=True,
        null=True,
    )

    dictionary_value = models.CharField(
        max_length=128,
        blank=True,
        null=True,
    )

    dictionary_value_description = models.TextField(
        blank=True,
        null=True,
    )

    definition_fixed = models.BooleanField(
        default=False,
    )

    def __str__(self):
        return str(self.id)


class NLPModel(models.Model):
    """
    A temporary model to hold the results from NLP string searches
    Created for Sprint 14
    """

    user_string = models.TextField(
        max_length=1024,
    )

    json_response = models.TextField(
        max_length=4096,
        blank=True,
        null=True,
    )

    def __str__(self):
        return str(self.id)
