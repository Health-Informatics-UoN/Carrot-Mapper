from django_filters.rest_framework import DjangoFilterBackend
from projects.serializers import (
    ProjectDatasetSerializer,
    ProjectSerializer,
    ProjectWithMembersSerializer,
)
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from shared.mapping.models import Project
from shared.mapping.permissions import CanViewProject


class ProjectList(ListAPIView):
    """
    API view to show all projects' names.
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {"name": ["in", "exact"]}

    def get_serializer_class(self):
        if (
            self.request.GET.get("name") is not None
            or self.request.GET.get("name__in") is not None
        ):
            return ProjectSerializer
        if self.request.GET.get("datasets") is not None:
            return ProjectDatasetSerializer

        return ProjectWithMembersSerializer

    def get_queryset(self):
        if dataset := self.request.GET.get("dataset"):
            return Project.objects.filter(
                datasets__exact=dataset, members__id=self.request.user.id
            ).distinct()

        return Project.objects.filter(members__id=self.request.user.id).distinct()


class ProjectDetail(RetrieveAPIView):
    """
    API view to retrieve a single project.
    Will return 403 Forbidden if User isn't a member.
    """

    permission_classes = [CanViewProject]
    serializer_class = ProjectSerializer
    queryset = Project.objects.all()
