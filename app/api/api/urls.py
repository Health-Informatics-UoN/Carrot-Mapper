import os

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    (
        path("", include("proxy.urls"))
        if os.environ.get("ENABLE_PROXY", "False").lower() == "true"
        else None
    ),
    path("", include("mapping.urls")),
    path("admin/", admin.site.urls),
    path("accounts/", include("django.contrib.auth.urls")),
]

urlpatterns = [url for url in urlpatterns if url is not None]
