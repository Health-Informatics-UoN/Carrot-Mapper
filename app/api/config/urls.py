import os

from config import settings
from django.contrib import admin
from django.urls import include, path, re_path
from revproxy.views import ProxyView  # type: ignore

urlpatterns = [
    path("api/", include("api.urls")),
    path("api_auth/", include("rest_framework.urls", namespace="rest_framework")),
    path("admin/", admin.site.urls),
    path("accounts/", include("django.contrib.auth.urls")),
    (
        re_path(r"(?P<path>.*)", ProxyView.as_view(upstream=f"{settings.NEXTJS_URL}/"))
        if os.environ.get("ENABLE_PROXY", "False").lower() == "true"
        else None
    ),
    path("", include("shared.mapping.urls")),
]

urlpatterns = [url for url in urlpatterns if url is not None]
