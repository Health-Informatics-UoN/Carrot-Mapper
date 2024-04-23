from api import views
from rest_framework import routers

routers = routers.DefaultRouter()


routers.register(r"omop/concepts", views.ConceptViewSet, basename="concepts")
routers.register(
    r"omop/conceptsfilter", views.ConceptFilterViewSet, basename="conceptsfilter"
)

routers.register(r"omop/vocabularies", views.VocabularyViewSet, basename="vocabularies")
routers.register(
    r"omop/conceptrelationships",
    views.ConceptRelationshipViewSet,
    basename="conceptrelationships",
)
routers.register(
    r"omop/conceptrelationshipfilter",
    views.ConceptRelationshipFilterViewSet,
    basename="conceptrelationshipfilter",
)

routers.register(
    r"omop/conceptancestors", views.ConceptAncestorViewSet, basename="conceptancestors"
)
routers.register(
    r"omop/conceptclasses", views.ConceptClassViewSet, basename="conceptclasses"
)
routers.register(
    r"omop/conceptsynonyms", views.ConceptSynonymViewSet, basename="conceptsynonyms"
)
routers.register(r"omop/domains", views.DomainViewSet, basename="domains")
routers.register(
    r"omop/drugstrengths", views.DrugStrengthViewSet, basename="drugstrengths"
)

routers.register(r"users", views.UserViewSet, basename="users")
routers.register(r"usersfilter", views.UserFilterViewSet, basename="usersfilter")

routers.register(r"scanreports", views.ScanReportListViewSet, basename="scanreports")
routers.register(
    r"scanreporttables", views.ScanReportTableViewSet, basename="scanreporttables"
)

routers.register(
    r"scanreportfields", views.ScanReportFieldViewSet, basename="scanreportfields"
)

routers.register(
    r"scanreportvalues", views.ScanReportValueViewSet, basename="scanreportvalues"
)
routers.register(
    r"scanreportfilter",
    views.ScanReportFilterViewSet,
    basename="scanreportfilter",
)

routers.register(
    r"scanreportactiveconceptfilter",
    views.ScanReportActiveConceptFilterViewSet,
    basename="scanreportactiveconceptfilter",
)


routers.register(
    r"scanreportvaluesfilterscanreport",
    views.ScanReportValuesFilterViewSetScanReport,
    basename="scanreportvaluesfilterscanreport",
)
routers.register(
    r"scanreportvaluesfilterscanreporttable",
    views.ScanReportValuesFilterViewSetScanReportTable,
    basename="scanreportvaluesfilterscanreporttable",
)

routers.register(
    r"scanreportvaluepks", views.ScanReportValuePKViewSet, basename="scanreportvaluepks"
)


routers.register(
    r"scanreportconcepts", views.ScanReportConceptViewSet, basename="scanreportconcepts"
)
routers.register(
    r"scanreportconceptsfilter",
    views.ScanReportConceptFilterViewSet,
    basename="scanreportconceptsfilter",
)

routers.register(
    r"classificationsystems",
    views.ClassificationSystemViewSet,
    basename="classificationsystems",
)
routers.register(
    r"datadictionaries", views.DataDictionaryViewSet, basename="DataDictionaries"
)

routers.register(r"datapartners", views.DataPartnerViewSet, basename="datapartners")
routers.register(
    r"datapartnersfilter", views.DataPartnerFilterViewSet, basename="datapartnersfilter"
)

routers.register(r"omoptables", views.OmopTableViewSet, basename="omoptables")
routers.register(
    r"omoptablesfilter", views.OmopTableFilterViewSet, basename="omoptablesfilter"
)
routers.register(r"omopfields", views.OmopFieldViewSet, basename="omopfields")
routers.register(
    r"omopfieldsfilter", views.OmopFieldFilterViewSet, basename="omopfieldsfilter"
)
routers.register(r"mappingrules", views.MappingRuleViewSet, basename="mappingrule")
routers.register(r"json", views.DownloadJSON, basename="getjson")
routers.register(r"mappingruleslist", views.RulesList, basename="getlist")
routers.register(
    r"mappingrulesfilter", views.MappingRuleFilterViewSet, basename="mappingrulefilter"
)
routers.register(r"analyse", views.AnalyseRules, basename="getanalysis")
