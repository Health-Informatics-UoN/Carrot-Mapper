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
        r"^datasets/(?P<path>(?![\d/]).*)$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/datasets"),
        name="datasets-list",
    ),
    re_path(
        "_next/(?P<path>.*)$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/_next"),
    ),
]
