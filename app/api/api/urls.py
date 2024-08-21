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
        views.MappingRulesList.as_view(),
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

urlpatterns += deprecated_urlpatterns
