from drf_dynamic_fields import DynamicFieldsMixin  # type: ignore
from rest_framework import serializers
from shared.mapping.models import Project
from shared.mapping.models import DataPartner, Dataset


class DataPartner(DynamicFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = DataPartner
        fields = [
            "id",
            "name",
        ]


class Dataset(DynamicFieldsMixin, serializers.ModelSerializer):

    data_partner = DataPartner(read_only=True)

    class Meta:
        model = Dataset
        fields = [
            "id",
            "name",
            "data_partner",
            "visibility",
            "created_at",
            "updated_at",
        ]


class ProjectSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    """
    Serialiser for showing all details of a Project. Use in RetrieveViews
    where User is permitted to view a particular Project.
    """

    datasets = Dataset(
        read_only=True,
        many=True,
    )

    class Meta:
        model = Project
        fields = ["id", "name", "members", "datasets", "created_at", "updated_at"]


class ProjectNameSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    """
    Serialiser for only showing the names of Projects. Use in non-admin ListViews.
    """

    class Meta:
        model = Project
        fields = ["id", "name"]


class ProjectWithMembersSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    """
    Serialiser for showing the names and members of Projects. Use in non-admin ListViews.
    """

    class Meta:
        model = Project
        fields = ["id", "name", "members", "created_at", "updated_at"]


class ProjectDatasetSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    """
    Serialiser for only showing the names of Projects. Use in non-admin ListViews.
    """

    class Meta:
        model = Project
        fields = ["name", "datasets", "members"]
