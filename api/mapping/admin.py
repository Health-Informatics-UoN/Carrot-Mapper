from django.contrib import admin

from .models import Source, Mapping, DataPartners, ScanReport, ScanReportValueRecord, ScanReportFieldOverviewRecord

admin.site.register(DataPartners)
admin.site.register(ScanReport)
admin.site.register(ScanReportValueRecord)
admin.site.register(ScanReportFieldOverviewRecord)
admin.site.register(Source)
admin.site.register(Mapping)
