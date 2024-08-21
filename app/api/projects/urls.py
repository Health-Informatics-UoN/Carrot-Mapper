from django.urls import path
from projects import views

urlpatterns = [
    path("", views.ProjectListView.as_view(), name="project_list"),
    path(
        "<int:pk>/",
        views.ProjectRetrieveView.as_view(),
        name="project_retrieve",
    ),
]
