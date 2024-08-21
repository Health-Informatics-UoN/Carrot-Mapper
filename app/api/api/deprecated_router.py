from api import views
from rest_framework import routers

router = routers.DefaultRouter()


router.register(r"omop/concepts", views.ConceptViewSet, basename="concepts")
router.register(
    r"omop/conceptsfilter", views.ConceptFilterViewSet, basename="conceptsfilter"
)
router.register(r"scanreports", views.ScanReportListViewSet, basename="scanreports")
router.register(
    r"scanreporttables", views.ScanReportTableViewSet, basename="scanreporttables"
)
router.register(
    r"scanreportfields", views.ScanReportFieldViewSet, basename="scanreportfields"
)
router.register(
    r"scanreportvalues", views.ScanReportValueViewSet, basename="scanreportvalues"
)
router.register(
    r"scanreportconcepts", views.ScanReportConceptViewSet, basename="scanreportconcepts"
)
router.register(
    r"scanreportconceptsfilter",
    views.ScanReportConceptFilterViewSet,
    basename="scanreportconceptsfilter",
)
router.register(r"omoptables", views.OmopTableViewSet, basename="omoptables")
router.register(r"omopfields", views.OmopFieldViewSet, basename="omopfields")
router.register(r"mappingrules", views.MappingRuleViewSet, basename="mappingrule")
