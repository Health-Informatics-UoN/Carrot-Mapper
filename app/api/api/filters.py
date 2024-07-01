from django.db.models.query_utils import Q
from rest_framework import filters
from shared.data.models import VisibilityChoices


class ScanReportAccessFilter(filters.BaseFilterBackend):
    """
    Filter that only allows users to see Scan Reports they are allowed to view, edit, or admin.

    """

    # Each model type needs a different relationship to get the Scan Report / Dataset permissions.
    RELATIONSHIP_MAPPING = {
        "scanreport": "",
        "scanreporttable": "scan_report__",
        "scanreportfield": "scan_report_table__scan_report__",
        "scanreportvalue": "scan_report_field__scan_report_table__scan_report__",
    }

    def filter_queryset(self, request, queryset, view):
        """
        Filters the queryset based on visibility and permissions related to datasets and scan reports.

        Args:
            - request: The request object.
            - queryset: The queryset to be filtered based on visibility and permissions.

        Returns:
            - A filtered queryset based on the specified visibility and permission conditions.
        """

        model = queryset.model.__name__.lower()
        relationship = self.RELATIONSHIP_MAPPING.get(model, "")

        dataset_visibility = f"{relationship}parent_dataset__visibility"
        scan_report_visibility = f"{relationship}visibility"
        scan_report_viewers = f"{relationship}viewers"
        scan_report_editors = f"{relationship}editors"
        scan_report_author = f"{relationship}author"
        dataset_viewers = f"{relationship}parent_dataset__viewers"
        dataset_editors = f"{relationship}parent_dataset__editors"
        dataset_admins = f"{relationship}parent_dataset__admins"

        return queryset.filter(
            Q(
                # parent dataset and SR are public
                **{dataset_visibility: VisibilityChoices.PUBLIC},
                **{scan_report_visibility: VisibilityChoices.PUBLIC},
            )
            |
            # parent dataset is public but SR restricted checks
            Q(
                # parent dataset is public
                # SR is restricted and user is in SR viewers
                **{dataset_visibility: VisibilityChoices.PUBLIC},
                **{scan_report_viewers: request.user.id},
                **{scan_report_visibility: VisibilityChoices.RESTRICTED},
            )
            | Q(
                # parent dataset is public
                # SR is restricted and user is in SR editors
                **{dataset_visibility: VisibilityChoices.PUBLIC},
                **{scan_report_editors: request.user.id},
                **{scan_report_visibility: VisibilityChoices.RESTRICTED},
            )
            | Q(
                # parent dataset is public
                # SR is restricted and user is SR author
                **{dataset_visibility: VisibilityChoices.PUBLIC},
                **{scan_report_author: request.user.id},
                **{scan_report_visibility: VisibilityChoices.RESTRICTED},
            )
            | Q(
                # parent dataset is public
                # SR is restricted and user is in parent dataset editors
                **{dataset_visibility: VisibilityChoices.PUBLIC},
                **{dataset_editors: request.user.id},
                **{scan_report_visibility: VisibilityChoices.RESTRICTED},
            )
            | Q(
                # parent dataset is public
                # SR is restricted and user is in parent dataset admins
                **{dataset_visibility: VisibilityChoices.PUBLIC},
                **{dataset_admins: request.user.id},
                **{scan_report_visibility: VisibilityChoices.RESTRICTED},
            )
            # parent dataset and SR are restricted checks
            | Q(
                # parent dataset and SR are restricted
                # user is in SR viewers
                **{dataset_visibility: VisibilityChoices.RESTRICTED},
                **{scan_report_viewers: request.user.id},
                **{scan_report_visibility: VisibilityChoices.RESTRICTED},
            )
            | Q(
                # parent dataset and SR are restricted
                # user is in SR editors
                **{dataset_visibility: VisibilityChoices.RESTRICTED},
                **{scan_report_editors: request.user.id},
                **{scan_report_visibility: VisibilityChoices.RESTRICTED},
            )
            | Q(
                # parent dataset and SR are restricted
                # user is SR author
                **{dataset_visibility: VisibilityChoices.RESTRICTED},
                **{scan_report_author: request.user.id},
                **{scan_report_visibility: VisibilityChoices.RESTRICTED},
            )
            | Q(
                # parent dataset and SR are restricted
                # user is in parent dataset admins
                **{dataset_visibility: VisibilityChoices.RESTRICTED},
                **{dataset_admins: request.user.id},
                **{scan_report_visibility: VisibilityChoices.RESTRICTED},
            )
            | Q(
                # parent dataset and SR are restricted
                # user is in parent dataset editors
                **{dataset_visibility: VisibilityChoices.RESTRICTED},
                **{dataset_editors: request.user.id},
                **{scan_report_visibility: VisibilityChoices.RESTRICTED},
            )
            # parent dataset is restricted but SR is public checks
            | Q(
                # parent dataset is restricted and SR public
                # user is in parent dataset editors
                **{dataset_visibility: VisibilityChoices.RESTRICTED},
                **{dataset_editors: request.user.id},
                **{scan_report_visibility: VisibilityChoices.PUBLIC},
            )
            | Q(
                # parent dataset is restricted and SR public
                # user is in parent dataset admins
                **{dataset_visibility: VisibilityChoices.RESTRICTED},
                **{dataset_admins: request.user.id},
                **{scan_report_visibility: VisibilityChoices.PUBLIC},
            )
            | Q(
                # parent dataset is restricted and SR public
                # user is in parent dataset viewers
                **{dataset_visibility: VisibilityChoices.RESTRICTED},
                **{dataset_viewers: request.user.id},
                **{scan_report_visibility: VisibilityChoices.PUBLIC},
            )
        ).distinct()
