from rest_framework import serializers


class ScanReportFieldSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = ScanReportField
