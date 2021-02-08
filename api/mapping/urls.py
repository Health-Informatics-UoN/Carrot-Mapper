from django.contrib.auth.decorators import login_required
from django.urls import path

from . import views
from .views import StructuralMappingDeleteView

urlpatterns = [
    path('', views.home, name='home'),
    path('tables/', views.ScanReportTableListView.as_view(), name='tables'),
    path('fields/', views.ScanReportFieldListView.as_view(), name='fields'),
    path('fields/<int:pk>/update/', views.ScanReportFieldUpdateView.as_view(), name='scan-report-field-update'),
    path('fields/<int:pk>/create_mapping/', views.AddMappingRuleFormView.as_view(), name='create-mapping-form'),
    path('fields/<int:pk>/mapping_rules/', views.StructuralMappingListView.as_view(), name='view-structural-mapping'),
    path('fields/<int:pk>/mapping_rules/delete', StructuralMappingDeleteView.as_view(), name='structural-mapping-delete'),
    path('values/', views.ScanReportValueListView.as_view(), name='values'),
    path('values/<int:pk>/update/', views.ScanReportValueUpdateView.as_view(), name='scan-report-value-update'),
    path('scanreports/', login_required(views.ScanReportListView.as_view()), name='scan-report-list'),
    path('scanreports/create/', login_required(views.ScanReportFormView.as_view()), name='scan-report-form'),
    path('signup/', views.SignUpView.as_view(), name='signup'),
]
