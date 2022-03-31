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


class ScanReportAdmin(admin.ModelAdmin):
    raw_id_fields = ("data_dictionary",)
    filter_horizontal = (
        "viewers",
        "editors",
    )


class ScanReportTableAdmin(admin.ModelAdmin):
    raw_id_fields = (
        "person_id",
        "date_event",
    )


class ScanReportValueAdmin(admin.ModelAdmin):
    raw_id_fields = ("scan_report_field",)


class MappingRuleAdmin(admin.ModelAdmin):
    raw_id_fields = (
        "scan_report",
        "omop_field",
        "source_table",
        "source_field",
        "concept",
    )


class ScanReportConceptAdmin(admin.ModelAdmin):
    raw_id_fields = (
        "concept",
        "content_object",
    )


class DatasetAdmin(admin.ModelAdmin):
    filter_horizontal = (
        "viewers",
        "admins",
        "editors",
    )


class ProjectAdmin(admin.ModelAdmin):
    filter_horizontal = (
        "datasets",
        "members",
    )


admin.site.register(DataPartner)
admin.site.register(ScanReport, ScanReportAdmin)
admin.site.register(ScanReportTable, ScanReportTableAdmin)
admin.site.register(ScanReportField)
admin.site.register(ScanReportValue, ScanReportValueAdmin)
admin.site.register(ScanReportAssertion)
admin.site.register(ClassificationSystem)
admin.site.register(OmopTable)
admin.site.register(OmopField)
admin.site.register(MappingRule, MappingRuleAdmin)
admin.site.register(DataDictionary)
admin.site.register(NLPModel)
admin.site.register(ScanReportConcept, ScanReportConceptAdmin)
admin.site.register(Dataset, DatasetAdmin)
admin.site.register(Project, ProjectAdmin)
