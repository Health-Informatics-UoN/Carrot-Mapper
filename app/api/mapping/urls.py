from django.urls import include, path

from . import views

urlpatterns = [
    # Dataset views
    path("", views.home, name="home"),
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
