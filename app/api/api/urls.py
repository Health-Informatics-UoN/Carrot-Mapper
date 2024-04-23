from api import views
from django.urls import include, path
from rest_framework import routers

routers = routers.DefaultRouter()

urlpatterns = [
    path("/", include(routers.urls)),
    path(r"api/contenttypeid", views.GetContentTypeID.as_view(), name="contenttypeid"),
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
]
