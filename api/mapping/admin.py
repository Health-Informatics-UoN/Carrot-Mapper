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
    list_display = (
        "id",
        "get_name",
        "get_parent_dataset",
    )

    def get_name(self, obj):
        return obj.dataset
    get_name.short_description = "Scan Report Name"

    def get_parent_dataset(self, obj):
        return "%s: %s" % (obj.parent_dataset.id, obj.parent_dataset.name)
    get_parent_dataset.short_description = "Parent Dataset"


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
    list_display = (
        "name",
        "id",
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
