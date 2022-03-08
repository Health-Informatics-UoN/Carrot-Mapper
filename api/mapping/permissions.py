import os
from typing import Any
from django.contrib.auth.models import User
from django.db.models.query_utils import Q
from rest_framework import permissions
from rest_framework.request import Request
from .models import (
    Project,
    Dataset,
    ScanReport,
    VisibilityChoices,
)


def is_az_function_user(user: User) -> bool:
    """Check of the user is the `AZ_FUNCTION_USER`

    Args:
        user (User): The user to check

    Returns:
        bool: `True` if `user` is the `AZ_FUNCTION_USER` else `False`
    """

    return user.username == os.getenv("AZ_FUNCTION_USER")


def has_viwership(obj: Any, request: Request) -> bool:
    """Check the viewership permission on an object.

    Args:
        obj (Any): The object to check the permissions on.
        request (Request): The request with the User instance.

    Returns:
        bool: `True` if the request's user has permission, else `False`.
    """
    checks = {
        Dataset: Dataset.objects.filter(
            Q(project__members=request.user.id)
            & (
                Q(visibility=VisibilityChoices.PUBLIC)
                | Q(visibility=VisibilityChoices.RESTRICTED, viewers=request.user.id)
            )
        ).exists(),
        ScanReport: ScanReport.objects.filter(
            Q(parent_dataset__project__members=request.user.id)
            & (
                Q(visibility=VisibilityChoices.PUBLIC)
                | Q(visibility=VisibilityChoices.RESTRICTED, viewers=request.user.id)
            )
        ).exists(),
    }
    return checks.get(type(obj), False)


class CanViewProject(permissions.BasePermission):
    message = "You must be a member of this project to view its contents."

    def has_object_permission(self, request, view, obj):
        """
        Return `True` if the User's ID is in the Project's members.
        """
        return obj.members.filter(id=request.user.id).exists()


class CanViewDataset(permissions.BasePermission):

    message = "You do not have permission to view this dataset"

    def has_object_permission(self, request, view, obj):
        """
        Return `True` in any of the following cases:
            - the User is the `AZ_FUNCTION_USER`
            - the Dataset is 'RESTRICTED' and the User is a Dataset viewer
            - the Dataset is 'PUBLIC' and the User is a member of a Project
            that the Dataset is in.
        """
        visibility = obj.visibility

        # if the User is the `AZ_FUNCTION_USER` grant permission
        if is_az_function_user(request.user):
            return True
        # if the visibility is restricted
        # check if the user is in the viewers field
        if visibility == "RESTRICTED":
            self.message = "You must be granted permission to view this dataset"
            return obj.viewers.filter(id=request.user.id).exists()
        # if the visibility is public
        # check if the user is a member in any projects the dataset is in
        elif visibility == "PUBLIC":
            # filter by projects that have dataset obj.id
            # filter by projects that have user as a member
            self.message = "You are not a member of any projects for this dataset"
            return Project.objects.filter(
                datasets__id=obj.id, members__id=request.user.id
            ).exists()
        return False


class CanAdminDataset(permissions.BasePermission):
    message = "You are not an admin of this Dataset."

    def has_object_permission(self, request, view, obj):
        """
        Return `True` in any of the following cases:
            - the User is the `AZ_FUNCTION_USER`
            - the User is in the Dataset's `admins` field
        """
        # if the User is the `AZ_FUNCTION_USER` grant permission
        if is_az_function_user(request.user):
            return True
        # if the User is in the Dataset's admins, return True,
        # else return false
        return obj.admins.filter(id=request.user.id).exists()


class CanViewScanReport(permissions.BasePermission):
    message = "You do not have permission to view this scan report"

    def has_object_permission(self, request, view, obj):
        """
        Return `True` in any of the following cases:
            - the User is the `AZ_FUNCTION_USER`
            - the ScanReport is 'RESTRICTED' and the User is a ScanReport viewer
            - the ScanReport is 'PUBLIC' and the User is a member of a Project
            that the ScanReport's parent Dataset is in.
        """
        visibility = obj.visibility

        # if the User is the `AZ_FUNCTION_USER` grant permission
        if is_az_function_user(request.user):
            return True
        # if the visibility is restricted
        # check if the user is in the viewers field
        if visibility == "RESTRICTED":
            self.message = "You must be granted permission to view this scan report"
            return obj.viewers.filter(id=request.user.id).exists()
        # if the visibility is public
        # check if the user is a member in any projects the parent dataset is in
        elif visibility == "PUBLIC":
            # get projects
            # filter by projects that have dataset obj.parent_dataset
            # filter by projects that have user as a member
            self.message = "You are not a member of any projects for this scan report"
            return Project.objects.filter(
                datasets__id=obj.parent_dataset.id, members__id=request.user.id
            ).exists()

        return False


class CanEditScanReport(permissions.BasePermission):
    message = "You do not have permission to edit this Scan Report."

    def has_object_permission(self, request, view, obj):
        """
        Return `True` in any of the following cases:
            - the User is the `AZ_FUNCTION_USER`
            - (unimplmented) the User is in the Scan Report's `editors` field
            - the User is in the parent Dataset's `admins` field
        """
        # if the User is the `AZ_FUNCTION_USER` grant permission
        if is_az_function_user(request.user):
            return True

        # TODO: add check for the User being in the editors field
        # once it is implemented.

        # if the User is in the parent Dataset's admins, return True,
        # else return false
        return obj.parent_dataset.admins.filter(id=request.user.id).exists()
