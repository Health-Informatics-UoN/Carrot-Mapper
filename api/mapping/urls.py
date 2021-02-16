from django.contrib.auth.decorators import login_required
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views
from .views import StructuralMappingDeleteView

urlpatterns = [
    path('', views.home, name='home'),
    path('tables/', login_required(views.ScanReportTableListView.as_view()), name='tables'),
    path('fields/', login_required(views.ScanReportFieldListView.as_view()), name='fields'),
    path('fields/<int:pk>/update/', login_required(views.ScanReportFieldUpdateView.as_view()), name='scan-report-field-update'),
    path('fields/<int:pk>/create_mapping/', login_required(views.AddMappingRuleFormView.as_view()), name='create-mapping-form'),
    path('fields/<int:pk>/mapping_rules/', login_required(views.StructuralMappingListView.as_view()), name='view-structural-mapping'),
    path('fields/<int:pk>/mapping_rules/delete', login_required(StructuralMappingDeleteView.as_view()), name='structural-mapping-delete'),
    path('values/', login_required(views.ScanReportValueListView.as_view()), name='values'),
    path('scanreports/', login_required(views.ScanReportListView.as_view()), name='scan-report-list'),
    path('scanreports/<int:pk>/mapping_rules', login_required(views.StructuralMappingTableListView.as_view()), name='tables-structural-mapping'),
    path('scanreports/create/', login_required(views.ScanReportFormView.as_view()), name='scan-report-form'),
    path('signup/', views.SignUpView.as_view(), name='signup'),
    path('documents/create/', login_required(views.DocumentFormView.as_view()), name='document-form'),
    path('documents/', login_required(views.DocumentListView.as_view()), name='document-list'),
    path('file/', login_required(views.FileListView.as_view()), name='file-list'),
    path('ajax/load-omop-fields/', login_required(views.load_omop_fields), name='ajax_load_omop_fields'),
]
if settings.DEBUG: # new
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


