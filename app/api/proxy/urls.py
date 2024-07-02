import os

from config import settings
from django.urls import re_path
from revproxy.views import ProxyView

# A set of urls that will override any root paths requested, and proxy them to the Next.js app.
urlpatterns = [
    # /scanreports/ and escape any further paths
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
        r"^scanreports/(?P<path>\d+/tables/\d+/update)/$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports/"),
        name="scan-report-edit-table",
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
        "_next/(?P<path>.*)$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/_next"),
    ),
]

# Conditionally enable this view until modals are complete
if os.environ.get("ENABLE_MAPPING_RULES_PROXY", "False").lower() == "true":
    urlpatterns.append(
        re_path(
            r"^scanreports/(?P<path>\d+/mapping_rules)/?$",
            ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports/"),
            name="scan-report-mapping-rules",
        ),
    )
