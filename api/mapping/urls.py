from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('scanreports/', views.ScanReportListView.as_view(), name='scan-report-list'),
    path('scanreports/create/', views.ScanReportFormView.as_view(), name='scan-report-form'),
]
