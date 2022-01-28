from django.contrib import admin

from .models import (
    DataPartner,
    ScanReport,
    ScanReportTable,
    ScanReportField,
    ScanReportValue,
    ScanReportAssertion,
    ClassificationSystem,
    OmopTable,
    OmopField,
    DataDictionary,
    MappingRule,
    NLPModel,
    ScanReportConcept,
    Dataset,
    Project,
)


admin.site.register(DataPartner)
admin.site.register(ScanReport)
admin.site.register(ScanReportTable)
admin.site.register(ScanReportField)
admin.site.register(ScanReportValue)
admin.site.register(ScanReportAssertion)
admin.site.register(ClassificationSystem)
admin.site.register(OmopTable)
admin.site.register(OmopField)
admin.site.register(MappingRule)
admin.site.register(DataDictionary)
admin.site.register(NLPModel)
admin.site.register(ScanReportConcept)
admin.site.register(Dataset)
admin.site.register(Project)
