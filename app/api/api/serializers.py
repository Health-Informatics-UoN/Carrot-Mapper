from django.contrib.auth.models import User
from drf_dynamic_fields import DynamicFieldsMixin
from mapping.permissions import has_editorship, is_admin, is_az_function_user
from mapping.services_rules import analyse_concepts, get_mapping_rules_json
from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied
from shared.data.models import (
    ClassificationSystem,
    DataDictionary,
    DataPartner,
    Dataset,
    MappingRule,
    OmopField,
    OmopTable,
    Project,
    ScanReport,
    ScanReportConcept,
    ScanReportField,
    ScanReportTable,
    ScanReportValue,
)
from shared.data.omop import (
    Concept,
    ConceptAncestor,
    ConceptClass,
    ConceptRelationship,
    ConceptSynonym,
    Domain,
    DrugStrength,
    Vocabulary,
)


class DataPartnerSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = DataPartner
        fields = "__all__"


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
    def validate(self, data):
        if request := self.context.get("request"):
            if ds := data.get("parent_dataset"):
                if not (
                    is_az_function_user(request.user)
                    or is_admin(ds, request)
                    or has_editorship(ds, request)
                ):
                    raise PermissionDenied(
                        "You must be an admin of the parent dataset to add a new scan report to it.",
                    )
            else:
                raise NotFound("Could not find parent dataset.")
        else:
            raise serializers.ValidationError(
                "Missing request context. Unable to validate scan report."
            )
        return super().validate(data)

    class Meta:
        model = ScanReport
        fields = "__all__"


class ScanReportViewSerializerV2(DynamicFieldsMixin, serializers.ModelSerializer):
    """
    Serializer for the ScanReportViewV2, for version 2.
    Args:
        self: The instance of the class.
        data: The data to be validated.
    Returns:
        dict: The validated data for the scan report.
    Raises:
        serializers.ValidationError: If the request context is missing.
        PermissionDenied: If the user does not have the required permissions.
        NotFound: If the parent dataset is not found.
    """

    parent_dataset = serializers.SerializerMethodField()
    data_partner = serializers.SerializerMethodField()

    class Meta:
        model = ScanReport
        fields = (
            "id",
            "name",
            "dataset",
            "parent_dataset",
            "data_partner",
            "status",
            "created_at",
            "hidden",
        )

    def get_parent_dataset(self, obj):
        return obj.parent_dataset.name if obj.parent_dataset else None

    def get_data_partner(self, obj):
        return (
            obj.parent_dataset.data_partner.name
            if obj.parent_dataset.data_partner
            else None
        )


class ScanReportEditSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    def validate_author(self, author):
        if request := self.context.get("request"):
            if not (
                is_admin(self.instance, request) or is_az_function_user(request.user)
            ):
                raise serializers.ValidationError(
                    """You must be the author of the scan report or an admin of the parent dataset
                    to change this field."""
                )
        return author

    def validate_viewers(self, viewers):
        if request := self.context.get("request"):
            if not (
                is_admin(self.instance, request) or is_az_function_user(request.user)
            ):
                raise serializers.ValidationError(
                    """You must be the author of the scan report or an admin of the parent dataset
                    to change this field."""
                )
        return viewers

    def validate_editors(self, editors):
        if request := self.context.get("request"):
            if not (
                is_admin(self.instance, request) or is_az_function_user(request.user)
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


class DatasetAndDataPartnerViewSerializer(
    DynamicFieldsMixin, serializers.ModelSerializer
):
    data_partner = DataPartnerSerializer(read_only=True)

    class Meta:
        model = Dataset
        fields = (
            "id",
            "name",
            "data_partner",
            "admins",
            "visibility",
            "created_at",
            "hidden",
        )


class DatasetEditSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    def validate_viewers(self, viewers):
        if request := self.context.get("request"):
            if not (
                is_admin(self.instance, request) or is_az_function_user(request.user)
            ):
                raise serializers.ValidationError(
                    "You must be an admin to change this field."
                )
        return viewers

    def validate_editors(self, editors):
        if request := self.context.get("request"):
            if not (
                is_admin(self.instance, request) or is_az_function_user(request.user)
            ):
                raise serializers.ValidationError(
                    "You must be an admin to change this field."
                )
        return editors

    def validate_admins(self, admins):
        if request := self.context.get("request"):
            if not (
                is_admin(self.instance, request) or is_az_function_user(request.user)
            ):
                raise serializers.ValidationError(
                    "You must be an admin to change this field."
                )
        return admins

    class Meta:
        model = Dataset
        fields = "__all__"


class ScanReportTableListSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    def validate(self, data):
        if request := self.context.get("request"):
            if sr := data.get("scan_report"):
                if not (
                    is_az_function_user(request.user)
                    or is_admin(sr, request)
                    or has_editorship(sr, request)
                ):
                    raise PermissionDenied(
                        "You must have editor or admin privileges on the scan report to edit its tables.",
                    )
            else:
                raise NotFound("Could not find the scan report for this table.")
        else:
            raise serializers.ValidationError(
                "Missing request context. Unable to validate scan report table."
            )
        return super().validate(data)

    class Meta:
        model = ScanReportTable
        fields = "__all__"


class ScanReportTableListSerializerV2(DynamicFieldsMixin, serializers.ModelSerializer):

    date_event = serializers.SerializerMethodField()
    person_id = serializers.SerializerMethodField()

    def validate(self, data):
        if request := self.context.get("request"):
            if sr := data.get("scan_report"):
                if not (
                    is_az_function_user(request.user)
                    or is_admin(sr, request)
                    or has_editorship(sr, request)
                ):
                    raise PermissionDenied(
                        "You must have editor or admin privileges on the scan report to edit its tables.",
                    )
            else:
                raise NotFound("Could not find the scan report for this table.")
        else:
            raise serializers.ValidationError(
                "Missing request context. Unable to validate scan report table."
            )
        return super().validate(data)

    def get_date_event(self, obj):
        return obj.date_event.name if obj.date_event else None

    def get_person_id(self, obj):
        return obj.person_id.name if obj.person_id else None

    class Meta:
        model = ScanReportTable
        fields = "__all__"


class ScanReportTableEditSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = ScanReportTable
        fields = "__all__"


class ScanReportFieldListSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=512, allow_blank=True, trim_whitespace=False
    )
    description_column = serializers.CharField(
        max_length=512, allow_blank=True, trim_whitespace=False
    )

    def validate(self, data):
        if request := self.context.get("request"):
            if srt := data.get("scan_report_table"):
                if not (
                    is_az_function_user(request.user)
                    or is_admin(srt, request)
                    or has_editorship(srt, request)
                ):
                    raise PermissionDenied(
                        "You must have editor or admin privileges on the scan report to edit its fields.",
                    )
            else:
                raise NotFound("Could not find the scan report table for this field.")
        else:
            raise serializers.ValidationError(
                "Missing request context. Unable to validate scan report field."
            )
        return super().validate(data)

    class Meta:
        model = ScanReportField
        fields = "__all__"


class ScanReportFieldListSerializerV2(DynamicFieldsMixin, serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=512, allow_blank=True, trim_whitespace=False
    )
    description_column = serializers.CharField(
        max_length=512, allow_blank=True, trim_whitespace=False
    )

    def validate(self, data):
        if request := self.context.get("request"):
            if srt := data.get("scan_report_table"):
                if not (
                    is_az_function_user(request.user)
                    or is_admin(srt, request)
                    or has_editorship(srt, request)
                ):
                    raise PermissionDenied(
                        "You must have editor or admin privileges on the scan report to edit its fields.",
                    )
            else:
                raise NotFound("Could not find the scan report table for this field.")
        else:
            raise serializers.ValidationError(
                "Missing request context. Unable to validate scan report field."
            )
        return super().validate(data)

    class Meta:
        model = ScanReportField
        fields = "__all__"


class ScanReportFieldEditSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=512, allow_blank=True, trim_whitespace=False
    )
    description_column = serializers.CharField(
        max_length=512, allow_blank=True, trim_whitespace=False
    )

    class Meta:
        model = ScanReportField
        fields = "__all__"


class ScanReportValueViewSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    value = serializers.CharField(
        max_length=128, allow_blank=True, trim_whitespace=False
    )

    def validate(self, data):
        if request := self.context.get("request"):
            if srf := data.get("scan_report_field"):
                if not (
                    is_az_function_user(request.user)
                    or is_admin(srf, request)
                    or has_editorship(srf, request)
                ):
                    raise PermissionDenied(
                        "You must have editor or admin privileges on the scan report to edit its values.",
                    )
            else:
                raise NotFound("Could not find the scan report field for this value.")
        else:
            raise serializers.ValidationError(
                "Missing request context. Unable to validate scan report value."
            )
        return super().validate(data)

    class Meta:
        model = ScanReportValue
        fields = "__all__"


class ScanReportValueEditSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
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
        fields = ["name", "members"]


class ProjectDatasetSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    """
    Serialiser for only showing the names of Projects. Use in non-admin ListViews.
    """

    class Meta:
        model = Project
        fields = ["name", "datasets", "members"]


class GetRulesJSON(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = ScanReport
        fields = "__all__"

    def to_representation(self, scan_report):
        qs = MappingRule.objects.filter(scan_report=scan_report)
        rules = get_mapping_rules_json(qs)
        return rules


class GetRulesAnalysis(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = ScanReport
        fields = "__all__"

    def to_representation(self, scan_report):
        analysis = analyse_concepts(scan_report.id)
        return analysis


class ContentTypeSerializer(serializers.Serializer):
    """
    Serializes the content type name.

    Args:
        self: The instance of the class.

    Attributes:
        type_name: The serialized content type name.

    """

    type_name = serializers.CharField(max_length=100)
