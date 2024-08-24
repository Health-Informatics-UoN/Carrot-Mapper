from api import views
from api.deprecated_router import router as deprecated_router
from api.router import router
from django.urls import include, path
from shared.files.views import FileDownloadView

from .deprecated_urls import urlpatterns as deprecated_urlpatterns

urlpatterns = [
    path("", include(router.urls)),
    path("", include(deprecated_router.urls)),
    path("datasets/", include("datasets.urls")),
    path("projects/", include("projects.urls")),
    path(
        "v2/scanreports/", views.ScanReportIndexV2.as_view(), name="scan-report-index"
    ),
    path(
        "v2/scanreports/concepts/",
        views.ScanReportConceptListV2.as_view(),
        name="scan-report-concepts",
    ),
    path(
        "v2/scanreports/concepts/<int:pk>/",
        views.ScanReportConceptDetailV2.as_view(),
        name="scan-report-concepts",
    ),
    path(
        "v2/scanreports/<int:pk>/",
        views.ScanReportDetailV2.as_view(),
        name="scan-report-detail",
    ),
    path(
        "v2/scanreports/<int:pk>/tables/",
        views.ScanReportTableIndexV2.as_view(),
        name="scan-report-tables",
    ),
    path(
        r"v2/scanreports/<int:pk>/download/",
        views.DownloadScanReportViewSet.as_view({"get": "list"}),
    ),
    path(
        r"v2/scanreports/<int:pk>/analyse/",
        views.AnalyseRules.as_view(),
        name="scan-reports-analyse",
    ),
    path(
        "v2/scanreports/<int:pk>/permissions/",
        views.ScanReportPermissionView.as_view(),
        name="scan-report-permissions",
    ),
    path(
        "scanreports/<int:pk>/mapping_rules/",
        views.MappingRulesList.as_view(),
        name="scan-report-rules",
    ),
    path(
        "v2/scanreports/<int:pk>/rules/",
        views.RulesList.as_view(),
        name="scan-report-rules",
    ),
    path(
        "v2/scanreports/<int:pk>/rules/summary",
        views.SummaryRulesList.as_view(),
        name="scan-report-rules-summary",
    ),
    path(
        "v2/scanreports/<int:scanreport_pk>/rules/downloads/",
        FileDownloadView.as_view(),
        name="scan-reports-downloads",
    ),
    path(
        "v2/scanreports/<int:scanreport_pk>/rules/downloads/<int:pk>",
        FileDownloadView.as_view(),
        name="scan-report-downloads-get",
    ),
    path(
        "v2/scanreports/<int:pk>/tables/<int:table_pk>/",
        views.ScanReportTableDetailV2.as_view(),
        name="scan-report-table-detail",
    ),
    path(
        "v2/scanreports/<int:pk>/tables/<int:table_pk>/fields/",
        views.ScanReportFieldIndexV2.as_view(),
        name="scan-report-fields",
    ),
    path(
        "v2/scanreports/<int:pk>/tables/<int:table_pk>/fields/<int:field_pk>/",
        views.ScanReportFieldDetailV2.as_view(),
        name="scan-report-fields-detail",
    ),
    path(
        "v2/scanreports/<int:pk>/tables/<int:table_pk>/fields/<int:field_pk>/values/",
        views.ScanReportValueListV2.as_view(),
        name="scan-report-values",
    ),
    path(r"user/me/", views.UserDetailView.as_view(), name="currentuser"),
]

urlpatterns += deprecated_urlpatterns
