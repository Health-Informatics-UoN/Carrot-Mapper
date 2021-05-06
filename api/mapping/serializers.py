from rest_framework import serializers
from data.models import Concept
from mapping.models import ScanReportField


class ScanReportFieldSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = ScanReportField


class ConceptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Concept
        fields = '__all__'
