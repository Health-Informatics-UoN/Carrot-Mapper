from django.urls import path,include
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('tables/', views.ScanReportTableListView.as_view(), name='tables'),
    path('fields/', views.ScanReportFieldListView.as_view(), name='fields'),
    path('scanreports/', login_required(views.ScanReportListView.as_view()), name='scan-report-list'),
    path('scanreports/create/', login_required(views.ScanReportFormView.as_view()), name='scan-report-form'),
    path('accounts/', include('django.contrib.auth.urls')),

]
