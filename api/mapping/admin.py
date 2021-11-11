from django.contrib import admin

from .models import (
    DocumentType,
    DataPartner,
    ScanReport,
    ScanReportTable,
    ScanReportField,
    ScanReportValue,
    ScanReportAssertion,
    ClassificationSystem,
    OmopTable,
    OmopField,
    Document,
    DocumentFile,
    DataDictionary,
    MappingRule,
    NLPModel,
    ScanReportConcept
)


admin.site.register(DataPartner)
admin.site.register(DocumentType)
admin.site.register(ScanReport)
admin.site.register(ScanReportTable)
admin.site.register(ScanReportField)
admin.site.register(ScanReportValue)
admin.site.register(ScanReportAssertion)
admin.site.register(ClassificationSystem)
admin.site.register(OmopTable)
admin.site.register(OmopField)
admin.site.register(MappingRule)
admin.site.register(Document)
admin.site.register(DocumentFile)
admin.site.register(DataDictionary)
admin.site.register(NLPModel)
admin.site.register(ScanReportConcept)
