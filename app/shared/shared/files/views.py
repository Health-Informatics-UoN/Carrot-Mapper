from rest_framework import viewsets

from .models import FileDownload
from .serializers import FileTypeSerializer


class FileDownloadViewSet(viewsets.ModelViewSet):
    queryset = FileDownload.objects.all()
    serializer_class = FileTypeSerializer
