from rest_framework import permissions


class CanViewProject(permissions.BasePermission):
    message = "You must be a member of this project to view its contents."

    def has_object_permission(self, request, view, obj):
        """
        Return `True` if the User's ID is in the Project's members.
        """
        return request.user.id in obj.members
