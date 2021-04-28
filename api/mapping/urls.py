from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.decorators import login_required
from django.urls import path

from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('tables/', views.ScanReportTableListView.as_view(), name='tables'),
    path('tables/<int:pk>/update/', views.ScanReportTableUpdateView.as_view(), name='scan-report-table-update'),
    path('fields/', views.ScanReportFieldListView.as_view(), name='fields'),
    path('fields/<int:pk>/update/', views.ScanReportFieldUpdateView.as_view(), name='scan-report-field-update'),
    path('values/', views.ScanReportValueListView.as_view(), name='values'),
    path('scanreports/', views.ScanReportListView.as_view(), name='scan-report-list'),
    path('scanreports/<int:pk>/mapping_rules/', views.StructuralMappingTableListView.as_view(), name='tables-structural-mapping'),
    path('scanreports/<int:pk>/mapping_rules/<str:omop_table>', views.StructuralMappingTableListView.as_view(), name='tables-structural-mapping-filter-lvl1'),
    path('scanreports/<int:pk>/mapping_rules/<str:omop_table>/<str:source_table>', views.StructuralMappingTableListView.as_view(), name='tables-structural-mapping-filter-lvl2'),
    path('scanreports/create/', views.ScanReportFormView.as_view(), name='scan-report-form'),
    path('scanreports/<int:pk>/assertions/', views.ScanReportAssertionView.as_view(), name='scan-report-assertion'),
    path('scanreports/<int:pk>/assertions/create/', views.ScanReportAssertionFormView.as_view(), name='scan-report-assertion-form'),
    path('scanreports/assertions/<int:pk>/update/', views.ScanReportAssertionsUpdateView.as_view(), name='scan-report-assertion-update'),

    path('datadictionary/', views.DataDictionaryListView.as_view(), name='data-dictionary'),
    path('datadictionary/<int:pk>/update', views.DataDictionaryUpdateView.as_view(), name='update-data-dictionary'),
    path('datadictionary/merge/', views.merge_dictionary, name='merge-data-dictionary'),
    path('testusagi/<int:scan_report_id>/', views.testusagi, name='testusagi'),
    
    path('nlp/', views.NLPListView.as_view(), name='nlp'),
    path('nlp/create/', views.NLPFormView.as_view(), name='nlp-form'),
    path('nlp/<int:pk>/', views.NLPDetailView.as_view(), name='nlp-view-query'),
    path('nlp/run', views.run_nlp, name='run-nlp'),

    path('signup/', views.SignUpView.as_view(), name='signup'),
    path('documents/create/', views.DocumentFormView.as_view(), name='document-form'),
    path('documents/', views.DocumentListView.as_view(), name='document-list'),
    path('documents/<int:pk>/files/', views.DocumentFileListView.as_view(), name='file-list'),
    path('documents/files/<int:pk>/update/', views.DocumentFileStatusUpdateView.as_view(), name='status-update'),
    path('documents/<int:pk>/files/create/', views.DocumentFileFormView.as_view(), name='file-form'),
    path('ajax/load-omop-fields/', views.load_omop_fields, name='ajax_load_omop_fields'),
    path('password-change/', views.CCPasswordChangeView.as_view(), name='password_change'),
    path('password-success/', views.CCPasswordChangeDoneView.as_view(), name='password_change_done'),
]
if settings.DEBUG: # new
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


