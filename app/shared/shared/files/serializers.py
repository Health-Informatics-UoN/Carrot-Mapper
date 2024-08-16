from django.contrib.auth.models import User
from rest_framework import serializers

from .models import FileDownload, FileType


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username"]


class FileTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileType
        fields = ["value", "display_name"]


class FileDownloadSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    file_type = FileTypeSerializer(read_only=True)

    class Meta:
        model = FileDownload
        fields = ["id", "created_at", "name", "user", "file_type", "file_url"]
