from django.urls import include, path
from rest_framework import routers

from . import views

routers = routers.DefaultRouter()


routers.register(r"omop/concepts", views.ConceptViewSet, basename="concepts")
routers.register(
    r"omop/conceptsfilter", views.ConceptFilterViewSet, basename="conceptsfilter"
)

routers.register(r"omop/vocabularies", views.VocabularyViewSet, basename="vocabularies")
routers.register(
    r"omop/conceptrelationships",
    views.ConceptRelationshipViewSet,
    basename="conceptrelationships",
)
routers.register(
    r"omop/conceptrelationshipfilter",
    views.ConceptRelationshipFilterViewSet,
    basename="conceptrelationshipfilter",
)

routers.register(
    r"omop/conceptancestors", views.ConceptAncestorViewSet, basename="conceptancestors"
)
routers.register(
    r"omop/conceptclasses", views.ConceptClassViewSet, basename="conceptclasses"
)
routers.register(
    r"omop/conceptsynonyms", views.ConceptSynonymViewSet, basename="conceptsynonyms"
)
routers.register(r"omop/domains", views.DomainViewSet, basename="domains")
routers.register(
    r"omop/drugstrengths", views.DrugStrengthViewSet, basename="drugstrengths"
)

routers.register(r"users", views.UserViewSet, basename="users")
routers.register(r"usersfilter", views.UserFilterViewSet, basename="users")

routers.register(r"scanreports", views.ScanReportListViewSet, basename="scanreports")
routers.register(
    r"scanreporttables", views.ScanReportTableViewSet, basename="scanreporttables"
)
# routers.register(
#     r"scanreporttablesfilter",
#     views.ScanReportTableFilterViewSet,
#     basename="scanreporttablesfilter",
# )

routers.register(
    r"scanreportfields", views.ScanReportFieldViewSet, basename="scanreportfields"
)
# routers.register(
#     r"scanreportfieldsfilter",
#     views.ScanReportFieldFilterViewSet,
#     basename="scanreportfieldsfilter",
# )

routers.register(
    r"scanreportvalues", views.ScanReportValueViewSet, basename="scanreportvalues"
)
# routers.register(
#     r"scanreportvaluesfilter",
#     views.ScanReportValueFilterViewSet,
#     basename="scanreportvaluesfilter",
# )
routers.register(
    r"scanreportfilter",
    views.ScanReportFilterViewSet,
    basename="scanreportfilter",
)

routers.register(
    r"scanreportactiveconceptfilter",
    views.ScanReportActiveConceptFilterViewSet,
    basename="scanreportactiveconceptfilter",
)


routers.register(
    r"scanreportvaluesfilterscanreport",
    views.ScanReportValuesFilterViewSetScanReport,
    basename="scanreportvaluesfilterscanreport",
)
routers.register(
    r"scanreportvaluesfilterscanreporttable",
    views.ScanReportValuesFilterViewSetScanReportTable,
    basename="scanreportvaluesfilterscanreporttable",
)

routers.register(
    r"scanreportvaluepks", views.ScanReportValuePKViewSet, basename="scanreportvaluepks"
)


routers.register(
    r"scanreportconcepts", views.ScanReportConceptViewSet, basename="scanreportconcepts"
)
routers.register(
    r"scanreportconceptsfilter",
    views.ScanReportConceptFilterViewSet,
    basename="scanreportconceptsfilter",
)

routers.register(
    r"scanreportconceptsbyscanreportidfilter",
    views.ScanReportConceptByScanReportIDFilterViewSet,
    basename="scanreportconceptsbyscanreportidfilter",
)

routers.register(
    r"scanreportconceptdetailsfilter",
    views.ScanReportConceptDetailsFilterViewSet,
    basename="scanreportconceptdetailsfilter",
)

routers.register(
    r"classificationsystems",
    views.ClassificationSystemViewSet,
    basename="classificationsystems",
)
routers.register(
    r"datadictionaries", views.DataDictionaryViewSet, basename="DataDictionaries"
)

routers.register(r"datapartners", views.DataPartnerViewSet, basename="datapartners")
routers.register(
    r"datapartnersfilter", views.DataPartnerFilterViewSet, basename="datapartnersfilter"
)

routers.register(r"omoptables", views.OmopTableViewSet, basename="omoptables")
routers.register(
    r"omoptablesfilter", views.OmopTableFilterViewSet, basename="omoptablesfilter"
)
routers.register(r"omopfields", views.OmopFieldViewSet, basename="omopfields")
routers.register(
    r"omopfieldsfilter", views.OmopFieldFilterViewSet, basename="omopfieldsfilter"
)
routers.register(r"mappingrules", views.MappingRuleViewSet, basename="mappingrule")
routers.register(r"json", views.DownloadJSON, basename="getjson")
routers.register(r"mappingruleslist", views.RulesList, basename="getlist")
routers.register(
    r"mappingrulesfilter", views.MappingRuleFilterViewSet, basename="mappingrulefilter"
)
routers.register(r"analyse", views.AnalyseRules, basename="getanalysis")

urlpatterns = [
    path(
        r"api/countprojects/<int:dataset>",
        views.CountProjects.as_view(),
        name="countprojects",
    ),
    path(r"api/countstats/", views.CountStats.as_view(), name="countstats"),
    path(
        r"api/countstatsscanreport/",
        views.CountStatsScanReport.as_view(),
        name="countstatsscanreport",
    ),
    path(
        r"api/countstatsscanreporttable/",
        views.CountStatsScanReportTable.as_view(),
        name="countstatsscanreporttable",
    ),
    path(
        r"api/countstatsscanreporttablefield/",
        views.CountStatsScanReportTableField.as_view(),
        name="countstatsscanreporttablefield",
    ),
    # Dataset views
    path(
        "datasets/",
        views.dataset_list_page,
        name="datasets",
    ),
    path(
        "datasets/<int:pk>/details/",
        views.dataset_admin_page,
        name="dataset_admin",
    ),
    path(
        "datasets/<int:pk>/",
        views.dataset_content_page,
        name="dataset_content",
    ),
    path(
        r"api/datasets/",
        views.DatasetListView.as_view(),
        name="dataset_list",
    ),
    path(
        r"api/datasets_data_partners/",
        views.DatasetAndDataPartnerListView.as_view(),
        name="dataset_data_partners_list",
    ),
    path(
        r"api/datasets/<int:pk>/",
        views.DatasetRetrieveView.as_view(),
        name="dataset_retrieve",
    ),
    path(
        r"api/datasets/update/<int:pk>/",
        views.DatasetUpdateView.as_view(),
        name="dataset_update",
    ),
    path(
        r"api/datasets/delete/<int:pk>/",
        views.DatasetDeleteView.as_view(),
        name="dataset_delete",
    ),
    path(
        r"api/datasets/create/",
        views.DatasetCreateView.as_view(),
        name="dataset_create",
    ),
    path(
        r"api/scanreports/<int:pk>/download/",
        views.DownloadScanReportViewSet.as_view({"get": "list"}),
    ),
    path("api/", include(routers.urls)),
    path("api_auth/", include("rest_framework.urls", namespace="rest_framework")),
    path("", views.home, name="home"),
    path("scanreports/", views.ScanReportListView.as_view(), name="scan-report-list"),
    path(
        "scanreports/<int:pk>/mapping_rules/",
        views.StructuralMappingTableListView.as_view(),
        name="tables-structural-mapping",
    ),
    path(
        "scanreports/<int:pk>/mapping_rules/<str:omop_table>",
        views.StructuralMappingTableListView.as_view(),
        name="tables-structural-mapping-filter-lvl1",
    ),
    path(
        "scanreports/<int:pk>/mapping_rules/<str:omop_table>/<str:source_table>",
        views.StructuralMappingTableListView.as_view(),
        name="tables-structural-mapping-filter-lvl2",
    ),
    path(
        "scanreports/create/",
        views.ScanReportFormView.as_view(),
        name="scan-report-form",
    ),
    path(
        "scanreports/<int:pk>/details/",
        views.scanreport_admin_page,
        name="scan-report-details-form",
    ),
    path(
        "scanreports/<int:pk>/assertions/",
        views.ScanReportAssertionView.as_view(),
        name="scan-report-assertion",
    ),
    path(
        "scanreports/<int:pk>/assertions/create/",
        views.ScanReportAssertionFormView.as_view(),
        name="scan-report-assertion-form",
    ),
    path(
        "scanreports/assertions/<int:pk>/update/",
        views.ScanReportAssertionsUpdateView.as_view(),
        name="scan-report-assertion-update",
    ),
    path("nlp/run", views.run_nlp_field_level, name="run-nlp"),
    path("nlp/table/run", views.run_nlp_table_level, name="run-nlp-table"),
    path(
        "ajax/load-omop-fields/", views.load_omop_fields, name="ajax_load_omop_fields"
    ),
    path(
        "password-change/", views.CCPasswordChangeView.as_view(), name="password_change"
    ),
    path(
        "password-success/",
        views.CCPasswordChangeDoneView.as_view(),
        name="password_change_done",
    ),
    # Project URLs
    path("api/projects/", views.ProjectListView.as_view(), name="project_list"),
    path(
        "api/projects/<int:pk>/",
        views.ProjectRetrieveView.as_view(),
        name="project_retrieve",
    ),
    path(
        r"api/projects/update/<int:pk>/",
        views.ProjectUpdateView.as_view(),
        name="projects_update",
    ),
    path(
        "scanreports/<int:pk>/",
        views.scanreport_table_list_page,
        name="scanreport_table",
    ),
    path(
        "scanreports/<int:sr>/tables/<int:pk>/",
        views.scanreport_fields_list_page,
        name="scanreport_fields",
    ),
    path(
        "scanreports/<int:sr>/tables/<int:tbl>/fields/<int:pk>/",
        views.scanreport_values_list_page,
        name="scanreport_values",
    ),
    path(
        "scanreports/<int:sr>/tables/<int:pk>/update/",
        views.update_scanreport_table_page,
        name="scan-report-table-update",
    ),
    path(
        "scanreports/<int:sr>/tables/<int:tbl>/fields/<int:pk>/update/",
        views.update_scanreport_field_page,
        name="scan-report-field-update",
    ),
]
# if settings.DEBUG: # new
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
