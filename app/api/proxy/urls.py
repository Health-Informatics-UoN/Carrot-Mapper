from api import settings
from django.urls import re_path
from revproxy.views import ProxyView

# A set of urls that will override any root paths requested, and proxy them to the Next.js app.
urlpatterns = [
    re_path(
        "scanreports/(?P<path>.*)$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports"),
        name="scan-report-list",
    ),
    re_path(
        "_next/(?P<path>.*)$",
        ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/_next"),
    ),
]
