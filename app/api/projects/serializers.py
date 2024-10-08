from drf_dynamic_fields import DynamicFieldsMixin  # type: ignore
from rest_framework import serializers
from shared.mapping.models import Project


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
        fields = ["id", "name"]


class ProjectWithMembersSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    """
    Serialiser for showing the names and members of Projects. Use in non-admin ListViews.
    """

    class Meta:
        model = Project
        fields = ["id", "name", "members"]


class ProjectDatasetSerializer(DynamicFieldsMixin, serializers.ModelSerializer):
    """
    Serialiser for only showing the names of Projects. Use in non-admin ListViews.
    """

    class Meta:
        model = Project
        fields = ["name", "datasets", "members"]
