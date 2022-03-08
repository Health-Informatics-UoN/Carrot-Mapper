import os
from typing import Any
from django.contrib.auth.models import User
from django.db.models.query_utils import Q
from rest_framework import permissions
from rest_framework.request import Request
from .models import (
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
    visibility_query = (
        lambda x: Q(visibility=VisibilityChoices.PUBLIC)
        if x.visibility == VisibilityChoices.PUBLIC
        else Q(visibility=VisibilityChoices.RESTRICTED, viewers=request.user.id)
    )
    checks = {
        Dataset: lambda: Dataset.objects.filter(
            Q(project__members=request.user.id) & visibility_query(obj), id=obj.id
        ).exists(),
        ScanReport: lambda: ScanReport.objects.filter(
            Q(parent_dataset__project__members=request.user.id) & visibility_query(obj),
            parent_dataset__id=obj.parent_dataset.id,
        ).exists(),
    }
    if permission_check := checks.get(type(obj)):
        return permission_check()
    return False


class CanViewProject(permissions.BasePermission):
    message = "You must be a member of this project to view its contents."

    def has_object_permission(self, request, view, obj):
        """
        Return `True` if the User's ID is in the Project's members.
        """
        return obj.members.filter(id=request.user.id).exists()


class CanView(permissions.BasePermission):

    message = "You do not have permission to view this."

    def has_object_permission(self, request, view, obj):
        """
        Return `True` in any of the following cases:
            - the User is the `AZ_FUNCTION_USER`
            - the Object is 'RESTRICTED' and the User is a, Object viewer
            - the Object is 'PUBLIC' and the User is a member of a Project
            that the Object is in.
        """

        if is_az_function_user(request.user):
            return True
        return has_viwership(obj, request)


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
