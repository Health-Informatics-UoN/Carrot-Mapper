from django.db.models.query_utils import Q
from rest_framework import filters
from shared.data.models import VisibilityChoices
import os


class ScanReportAccessFilter(filters.BaseFilterBackend):
    RELATIONSHIP_MAPPING = {
        "scanreport": "",
        "scanreporttable": "scan_report__",
        "scanreportfield": "scan_report_table__scan_report__",
        "scanreportvalue": "scan_report_field__scan_report_table__scan_report__",
    }

    def filter_queryset(self, request, queryset, view):
        user = request.user

        print(f"Filtering for user: {user.username}")

        if user.username == os.getenv("AZ_FUNCTION_USER"):
            print("AZ_FUNCTION_USER detected, returning full queryset")
            return queryset

        model = queryset.model.__name__.lower()
        relationship = self.RELATIONSHIP_MAPPING.get(model, "")
        print(f"Model: {model}, Relationship: {relationship}")
        print(f"RELATIONSHIP_MAPPING keys: {self.RELATIONSHIP_MAPPING.keys()}")

        relationship = self.RELATIONSHIP_MAPPING.get(model, "")
        print(f"Relationship: '{relationship}'")

        visibility_conditions = self.get_visibility_conditions(relationship)
        permission_conditions = self.get_permission_conditions(relationship, user.id)

        print("Visibility conditions:", visibility_conditions)
        print("Permission conditions:", permission_conditions)

        filtered_queryset = (
            queryset.filter((visibility_conditions & permission_conditions))
            .filter(**{f"{relationship}parent_dataset__project__members": user.id})
            .distinct()
        )

        return filtered_queryset

    def get_visibility_conditions(self, relationship: str) -> Q:
        dataset_visibility = f"{relationship}parent_dataset__visibility"
        scan_report_visibility = f"{relationship}visibility"

        return (
            Q(**{dataset_visibility: VisibilityChoices.PUBLIC})
            | Q(**{dataset_visibility: VisibilityChoices.RESTRICTED})
        ) & (
            Q(**{scan_report_visibility: VisibilityChoices.PUBLIC})
            | Q(**{scan_report_visibility: VisibilityChoices.RESTRICTED})
        )

    def get_permission_conditions(self, relationship: str, user_id: int) -> Q:
        return Q(
            Q(**{f"{relationship}viewers": user_id})
            | Q(**{f"{relationship}editors": user_id})
            | Q(**{f"{relationship}author": user_id})
            | Q(**{f"{relationship}parent_dataset__viewers": user_id})
            | Q(**{f"{relationship}parent_dataset__editors": user_id})
            | Q(**{f"{relationship}parent_dataset__admins": user_id})
        ) | (
            Q(**{f"{relationship}parent_dataset__visibility": VisibilityChoices.PUBLIC})
            & Q(**{f"{relationship}visibility": VisibilityChoices.PUBLIC})
        )


class ScanReportAccessFilterV2(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        user = request.user

        if user.username == os.getenv("AZ_FUNCTION_USER"):
            return queryset

        return (
            queryset.filter(
                (
                    Q(parent_dataset__visibility=VisibilityChoices.PUBLIC)
                    & (
                        Q(visibility=VisibilityChoices.PUBLIC)
                        | (
                            Q(visibility=VisibilityChoices.RESTRICTED)
                            & (
                                Q(viewers=user.id)
                                | Q(editors=user.id)
                                | Q(author=user.id)
                                | Q(parent_dataset__editors=user.id)
                                | Q(parent_dataset__admins=user.id)
                            )
                        )
                    )
                )
                | (
                    Q(parent_dataset__visibility=VisibilityChoices.RESTRICTED)
                    & (
                        Q(parent_dataset__admins=user.id)
                        | Q(parent_dataset__editors=user.id)
                        | (
                            Q(parent_dataset__viewers=user.id)
                            & (
                                Q(viewers=user.id)
                                | Q(editors=user.id)
                                | Q(author=user.id)
                                | Q(visibility=VisibilityChoices.PUBLIC)
                            )
                        )
                    )
                )
            )
            .filter(parent_dataset__project__members=user.id)
            .distinct()
        )
