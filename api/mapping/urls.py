from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.decorators import login_required
from django.urls import include,path
from rest_framework import routers

from . import views

routers=routers.DefaultRouter()


routers.register(r'omop/concepts', views.ConceptViewSet,basename='concepts')
routers.register(r'omop/conceptsfilter', views.ConceptFilterViewSet,basename='conceptsfilter')

routers.register(r'omop/vocabularies', views.VocabularyViewSet,basename='vocabularies')
routers.register(r'omop/conceptrelationships', views.ConceptRelationshipViewSet,basename='conceptrelationships')
routers.register(r'omop/conceptancestors', views.ConceptAncestorViewSet, basename='conceptancestors')
routers.register(r'omop/conceptclasses', views.ConceptClassViewSet,basename='conceptclasses')
routers.register(r'omop/conceptsynonyms', views.ConceptSynonymViewSet,basename='conceptsynonyms')
routers.register(r'omop/domains', views.DomainViewSet,basename='domains')
routers.register(r'omop/drugstrengths', views.DrugStrengthViewSet,basename='drugstrengths')


routers.register(r'scanreports', views.ScanReportViewSet,basename='scanreports')

routers.register(r'scanreporttables', views.ScanReportTableViewSet,basename='scanreporttables')
routers.register(r'scanreporttablesfilter', views.ScanReportTableFilterViewSet,basename='scanreporttablesfilter')

routers.register(r'scanreportfields', views.ScanReportFieldViewSet,basename='scanreportfields')
routers.register(r'scanreportfieldsfilter', views.ScanReportFieldFilterViewSet,basename='scanreportfieldsfilter')

routers.register(r'scanreportvalues', views.ScanReportValueViewSet,basename='scanreportvalues')
routers.register(r'scanreportvaluesfilter', views.ScanReportValueFilterViewSet,basename='scanreportvaluesfilter')

routers.register(r'scanreportconcepts', views.ScanReportConceptViewSet,basename='scanreportconcepts')
routers.register(r'scanreportconceptsfilter', views.ScanReportConceptFilterViewSet,basename='scanreportconceptsfilter')

routers.register(r'mappings',views.MappingViewSet,basename='mappings')
routers.register(r'classificationsystems',views.ClassificationSystemViewSet,basename='classificationsystems')
routers.register(r'datadictionaries',views.DataDictionaryViewSet,basename='DataDictionaries')
routers.register(r'documents',views.DocumentViewSet,basename='documents')
routers.register(r'documentfiles',views.DocumentFileViewSet,basename='documentfiles')

routers.register(r'datapartners',views.DataPartnerViewSet,basename='datapartners')
routers.register(r'datapartnersfilter',views.DataPartnerFilterViewSet,basename='datapartnersfilter')

routers.register(r'omoptables',views.OmopTableViewSet,basename='omoptables')
routers.register(r'omopfields',views.OmopFieldViewSet,basename='omopfields')
routers.register(r'structuralmappingrules',views.StructuralMappingRuleViewSet,basename='structuralmappingrule')
routers.register(r'sources',views.SourceViewSet,basename='sources')
routers.register(r'documenttypes',views.DocumentTypeViewSet,basename='documenttypes')

urlpatterns = [
    path('api/',include(routers.urls)),
    path('api_auth/',include('rest_framework.urls',namespace='rest_framework')),
    
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
    path('scanreports/field-concepts/', views.save_scan_report_field_concept, name="scan_report_field_concept"),
    path('scanreports/field-concepts/delete/', views.delete_scan_report_field_concept, name="scan_report_field_concept-delete"),
    path('scanreports/value-concepts/', views.save_scan_report_value_concept, name="scan_report_value_concept"),
    path('scanreports/value-concepts/delete/', views.delete_scan_report_value_concept, name="scan_report_value_concept-delete"),

    path('datadictionary/', views.DataDictionaryListView.as_view(), name='data-dictionary'),
    path('datadictionary/<int:pk>/update', views.DataDictionaryUpdateView.as_view(), name='update-data-dictionary'),
    path('datadictionary/merge/', views.merge_dictionary, name='merge-data-dictionary'),
    path('testusagi/<int:scan_report_id>/', views.testusagi, name='testusagi'),
    
    path('nlp/', views.NLPListView.as_view(), name='nlp'),
    path('nlp/create/', views.NLPFormView.as_view(), name='nlp-form'),
    path('nlp/<int:pk>/', views.NLPDetailView.as_view(), name='nlp-view-query'),
    path('nlp/run', views.run_nlp, name='run-nlp'),
    path('nlp/results', views.NLPResultsListView.as_view(), name='nlp-view-results'),

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


