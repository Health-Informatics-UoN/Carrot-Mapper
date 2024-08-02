import os

from config import settings
from django.urls import re_path
from revproxy.views import ProxyView
from django.views.generic.base import RedirectView

favicon_view = RedirectView.as_view(url="/static/images/favicon.ico", permanent=True)
# A set of urls that will override any root paths requested, and proxy them to the Next.js app.
urlpatterns = [
    # /scanreports/ and escape any further paths
    re_path(
        r"^scanreports/(?P<path>create)/$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports"),
        name="scan-report-create",
    ),
    re_path(
        r"^scanreports/(?P<path>(?!create))$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports"),
        name="scan-report-list",
    ),
    re_path(
        r"^scanreports/(?P<path>\d+)/?$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports/"),
        name="scan-report-tables",
    ),
    re_path(
        r"^scanreports/(?P<path>\d+/details)/$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports/"),
        name="scan-report-details",
    ),
    re_path(
        r"^scanreports/(?P<path>\d+/tables/\d+)/$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports/"),
        name="scan-report-fields",
    ),
    re_path(
        r"^scanreports/(?P<path>\d+/tables/\d+/fields/\d+)/$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports/"),
        name="scan-report-values",
    ),
    re_path(
        r"^scanreports/(?P<path>\d+/tables/\d+/fields/\d+/update)/$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports/"),
        name="scan-report-edit-field",
    ),
    re_path(
        r"^scanreports/(?P<path>\d+/tables/\d+/update)/$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports/"),
        name="scan-report-edit-table",
    ),
    re_path(
        r"^scanreports/(?P<path>\d+/mapping_rules)/?$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports/"),
        name="scan-report-mapping-rules",
    ),
    re_path(
        r"^datasets/(?P<path>(?![\d/]).*)$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/datasets"),
        name="datasets-list",
    ),
    re_path(
        r"^datasets/(?P<path>\d+)/?$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/datasets"),
        name="datasets-scanreports-list",
    ),
    re_path(
        r"^datasets/(?P<path>\d+/details)/$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/datasets/"),
        name="dataset-details",
    ),
    re_path(
        r"^scanreports/(?P<path>\d+/review_rules)/?$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports/"),
        name="scan-report-review-rules",
    ),
    re_path(
        "_next/(?P<path>.*)$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/_next"),
    ),
    re_path(r"^favicon\.ico$", favicon_view),
]
