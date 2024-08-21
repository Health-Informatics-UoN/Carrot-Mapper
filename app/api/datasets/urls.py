from datasets import views
from django.urls import path

urlpatterns = [
    path(
        r"datasets/",
        views.DatasetListView.as_view(),
        name="dataset_list",
    ),
    path(
        r"datasets_data_partners/",
        views.DatasetAndDataPartnerListView.as_view(),
        name="dataset_data_partners_list",
    ),
    path(
        r"datasets/<int:pk>/",
        views.DatasetRetrieveView.as_view(),
        name="dataset_retrieve",
    ),
    path(
        r"datasets/update/<int:pk>/",
        views.DatasetUpdateView.as_view(),
        name="dataset_update",
    ),
    path(
        r"datasets/delete/<int:pk>/",
        views.DatasetDeleteView.as_view(),
        name="dataset_delete",
    ),
    path(
        r"datasets/create/",
        views.DatasetCreateView.as_view(),
        name="dataset_create",
    ),
    path(
        "dataset/<int:pk>/permissions/",
        views.DatasetPermissionView.as_view(),
        name="dataset-permissions",
    ),
]
