import os

from django.contrib import admin
from django.urls import include, path, re_path
from revproxy.views import ProxyView
from django.conf import settings

urlpatterns = [
    (
        path("", include("proxy.urls"))
        if os.environ.get("ENABLE_PROXY", "False").lower() == "true"
        else None
    ),
    (
        re_path(
            r"^scanreports/(?P<path>create)/$",
            ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/scanreports"),
            name="scan-report-create",
        )
        if os.environ.get("ENABLE_SCAN_REPORT_CREATE", "False").lower() == "true"
        else None
    ),
    path("api/", include("api.urls")),
    path("", include("mapping.urls")),
    path("api_auth/", include("rest_framework.urls", namespace="rest_framework")),
    path("admin/", admin.site.urls),
    path("accounts/", include("django.contrib.auth.urls")),
]

urlpatterns = [url for url in urlpatterns if url is not None]
