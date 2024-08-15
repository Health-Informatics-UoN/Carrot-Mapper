from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from shared.data.models import ScanReport
from shared.files.paginations import CustomPagination

from .models import FileDownload
from .serializers import FileDownloadSerializer
from .service import get_blob


class FileDownloadView(GenericAPIView, ListModelMixin, RetrieveModelMixin):
    serializer_class = FileDownloadSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    pagination_class = CustomPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        scan_report_id = self.kwargs["scanreport_pk"]
        scan_report = get_object_or_404(ScanReport, pk=scan_report_id)

        return FileDownload.objects.filter(scan_report=scan_report)

    def get(self, request, *args, **kwargs):
        if "pk" in kwargs:
            entity = get_object_or_404(FileDownload, pk=kwargs["pk"])
            file = get_blob(entity.file_url, "rules-exports")

            response = HttpResponse(file, content_type="application/octet-stream")
            response["Content-Disposition"] = f'attachment; filename="{entity.name}"'
            return response

        return self.list(request, *args, **kwargs)
