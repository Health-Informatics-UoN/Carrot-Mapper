from api import deprecated_views
from django.urls import path

urlpatterns = [
    path(
        r"contenttypeid",
        deprecated_views.GetContentTypeID.as_view(),
        name="contenttypeid",
    ),
    path(
        r"countprojects/<int:dataset>",
        deprecated_views.CountProjects.as_view(),
        name="countprojects",
    ),
    path(r"countstats/", deprecated_views.CountStats.as_view(), name="countstats"),
    path(
        r"countstatsscanreport/",
        deprecated_views.CountStatsScanReport.as_view(),
        name="countstatsscanreport",
    ),
    path(
        r"countstatsscanreporttable/",
        deprecated_views.CountStatsScanReportTable.as_view(),
        name="countstatsscanreporttable",
    ),
    path(
        r"countstatsscanreporttablefield/",
        deprecated_views.CountStatsScanReportTableField.as_view(),
        name="countstatsscanreporttablefield",
    ),
]
