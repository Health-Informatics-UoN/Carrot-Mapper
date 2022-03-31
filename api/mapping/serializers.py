from rest_framework import serializers
from drf_dynamic_fields import DynamicFieldsMixin
from django.contrib.auth.models import User
from data.models import (
    Concept,
    Vocabulary,
    ConceptRelationship,
    ConceptAncestor,
    ConceptClass,
    ConceptSynonym,
    Domain,
    DrugStrength,
)
from mapping.models import (
    ScanReportField,
    ScanReportValue,
    ScanReport,
    ScanReportTable,
    ScanReportConcept,
    ClassificationSystem,
    DataDictionary,
    DataPartner,
    OmopField,
    OmopTable,
    MappingRule,
    Dataset,
    Project,
)

from .services_rules import (
    analyse_concepts,
    get_mapping_rules_json,
    get_mapping_rules_list,
)


class ConceptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Concept
        fields = "__all__"


class VocabularySerializer(serializers.ModelSerializer):
    class Meta:
        model = Vocabulary
        fields = "__all__"


class ConceptRelationshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConceptRelationship
        fields = "__all__"


class ConceptAncestorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConceptAncestor
        fields = "__all__"


class ConceptClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConceptClass
        fields = "__all__"


class ConceptSynonymSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConceptSynonym
        fields = "__all__"


class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = "__all__"


class DrugStrengthSerializer(serializers.ModelSerializer):
    class Meta:
        model = DrugStrength
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username")


class ScanReportViewSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = ScanReport
        fields = "__all__"


class ScanReportEditSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    def validate_viewers(self, viewers):
        if request := self.context.get("request"):
            user = request.user
            if not (
                self.instance.author.id == user.id
                or self.instance.parent_dataset.admins.filter(id=user.id).exists()
            ):
                raise serializers.ValidationError(
                    """You must be the author of the scan report or an admin of the parent dataset 
                    to change this field."""
                )
        return viewers

    def validate_editors(self, editors):
        if request := self.context.get("request"):
            user = request.user
            if not (
                self.instance.author.id == user.id
                or self.instance.parent_dataset.admins.filter(id=user.id).exists()
            ):
                raise serializers.ValidationError(
                    """You must be the author of the scan report or an admin of the parent dataset 
                    to change this field."""
                )
        return editors

    class Meta:
        model = ScanReport
        fields = "__all__"


class DatasetViewSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = "__all__"


class DatasetEditSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    def validate_viewers(self, viewers):
        if request := self.context.get("request"):
            user = request.user
            if not self.instance.admins.filter(id=user.id).exists():
                raise serializers.ValidationError(
                    "You must be an admin to change this field."
                )
        return viewers

    def validate_editors(self, editors):
        if request := self.context.get("request"):
            user = request.user
            if not self.instance.admins.filter(id=user.id).exists():
                raise serializers.ValidationError(
                    "You must be an admin to change this field."
                )
        return editors

    def validate_admins(self, admins):
        if request := self.context.get("request"):
            user = request.user
            if not self.instance.admins.filter(id=user.id).exists():
                raise serializers.ValidationError(
                    "You must be an admin to change this field."
                )
        return admins

    class Meta:
        model = Dataset
        fields = "__all__"


class ScanReportTableSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = ScanReportTable
        fields = "__all__"


class ScanReportFieldSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=512, allow_blank=True, trim_whitespace=False
    )
    description_column = serializers.CharField(
        max_length=512, allow_blank=True, trim_whitespace=False
    )

    class Meta:
        model = ScanReportField
        fields = "__all__"


class ScanReportValueSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    value = serializers.CharField(
        max_length=128, allow_blank=True, trim_whitespace=False
    )

    class Meta:
        model = ScanReportValue
        fields = "__all__"


class ScanReportConceptSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = ScanReportConcept
        fields = "__all__"


class ClassificationSystemSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = ClassificationSystem
        fields = "__all__"


class DataDictionarySerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = DataDictionary
        fields = "__all__"


class DataPartnerSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = DataPartner
        fields = "__all__"


class OmopFieldSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = OmopField
        fields = "__all__"


class OmopTableSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = OmopTable
        fields = "__all__"


class MappingRuleSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = MappingRule
        fields = "__all__"


class ProjectSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    """
    Serialiser for showing all details of a Project. Use in RetrieveViews
    where User is permitted to view a particular Project.
    """

    class Meta:
        model = Project
        fields = "__all__"


class ProjectNameSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    """
    Serialiser for only showing the names of Projects. Use in non-admin ListViews.
    """

    class Meta:
        model = Project
        fields = ["name"]


class ProjectDatasetSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    """
    Serialiser for only showing the names of Projects. Use in non-admin ListViews.
    """

    class Meta:
        model = Project
        fields = ["name", "datasets"]


class GetRulesJSON(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = ScanReport
        fields = "__all__"

    def to_representation(self, scan_report):
        qs = MappingRule.objects.filter(scan_report=scan_report)
        rules = get_mapping_rules_json(qs)
        return rules


class GetRulesList(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = ScanReport
        fields = "__all__"

    def to_representation(self, scan_report):
        qs = MappingRule.objects.filter(scan_report=scan_report)
        rules = get_mapping_rules_list(qs)
        for rule in rules:
            rule["destination_table"] = {
                "id": int(str(rule["destination_table"])),
                "name": rule["destination_table"].table,
            }

            rule["destination_field"] = {
                "id": int(str(rule["destination_field"])),
                "name": rule["destination_field"].field,
            }

            rule["source_table"] = {
                "id": int(str(rule["source_table"])),
                "name": rule["source_table"].name,
            }

            rule["source_field"] = {
                "id": int(str(rule["source_field"])),
                "name": rule["source_field"].name,
            }

        return rules


class GetRulesAnalysis(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = ScanReport
        fields = "__all__"

    def to_representation(self, scan_report):
        analysis = analyse_concepts(scan_report.id)
        return analysis
