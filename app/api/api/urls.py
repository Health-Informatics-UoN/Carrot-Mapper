from api import views
from api.router import router
from django.urls import include, path
from shared.files.views import FileDownloadView

urlpatterns = [
    path("", include(router.urls)),
    path("datasets/", include("datasets.urls")),
    path("projects/", include("projects.urls")),
    path(r"contenttypeid", views.GetContentTypeID.as_view(), name="contenttypeid"),
    path(
        r"countprojects/<int:dataset>",
        views.CountProjects.as_view(),
        name="countprojects",
    ),
    path(r"countstats/", views.CountStats.as_view(), name="countstats"),
    path(
        r"countstatsscanreport/",
        views.CountStatsScanReport.as_view(),
        name="countstatsscanreport",
    ),
    path(
        r"countstatsscanreporttable/",
        views.CountStatsScanReportTable.as_view(),
        name="countstatsscanreporttable",
    ),
    path(
        r"countstatsscanreporttablefield/",
        views.CountStatsScanReportTableField.as_view(),
        name="countstatsscanreporttablefield",
    ),
    path(
        r"scanreports/<int:pk>/download/",
        views.DownloadScanReportViewSet.as_view({"get": "list"}),
    ),
    path(
        "scanreports/<int:pk>/permissions/",
        views.ScanReportPermissionView.as_view(),
        name="scan-report-permissions",
    ),
    path(
        "scanreports/<int:pk>/mapping_rules/",
        views.StructuralMappingTableAPIView.as_view(),
        name="tables-structural-mapping",
    ),
    path(
        "scanreports/<int:scanreport_pk>/mapping_rules/downloads/",
        FileDownloadView.as_view(),
        name="filedownload-list",
    ),
    path(
        "scanreports/<int:scanreport_pk>/mapping_rules/downloads/<int:pk>",
        FileDownloadView.as_view(),
        name="filedownload-get",
    ),
    path(r"user/me", views.UserDetailView.as_view(), name="currentuser"),
]
