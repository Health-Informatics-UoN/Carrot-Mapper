from django.contrib import admin

from .models import DocumentType, Source,DataPartners, ScanReport, \
    ScanReportTable, \
    ScanReportField, ScanReportValue,\
    ClassificationSystem, OmopTable, OmopField, MappingRule,Document,DocumentFile

admin.site.register(DataPartners)
admin.site.register(DocumentType)
admin.site.register(ScanReport)
admin.site.register(ScanReportTable)
admin.site.register(ScanReportField)
admin.site.register(ScanReportValue)
admin.site.register(Source)
admin.site.register(ClassificationSystem)
admin.site.register(OmopTable)
admin.site.register(OmopField)
admin.site.register(MappingRule)
admin.site.register(Document)
admin.site.register(DocumentFile)
