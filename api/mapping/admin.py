from django.contrib import admin

from .models import Source, Mapping, DataPartners, ScanReport, \
    ScanReportTable, \
    ScanReportField, ScanReportValue,\
    ClassificationSystem

admin.site.register(DataPartners)
admin.site.register(ScanReport)
admin.site.register(ScanReportTable)
admin.site.register(ScanReportField)
admin.site.register(ScanReportValue)
admin.site.register(Source)
admin.site.register(Mapping)
admin.site.register(ClassificationSystem)
