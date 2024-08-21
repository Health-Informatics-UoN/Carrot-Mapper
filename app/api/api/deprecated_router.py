from api import deprecated_views
from rest_framework import routers

router = routers.DefaultRouter()


router.register(r"omop/concepts", deprecated_views.ConceptViewSet, basename="concepts")
router.register(
    r"omop/conceptsfilter",
    deprecated_views.ConceptFilterViewSet,
    basename="conceptsfilter",
)
router.register(
    r"scanreports", deprecated_views.ScanReportListViewSet, basename="scanreports"
)
router.register(
    r"scanreporttables",
    deprecated_views.ScanReportTableViewSet,
    basename="scanreporttables",
)
router.register(
    r"scanreportfields",
    deprecated_views.ScanReportFieldViewSet,
    basename="scanreportfields",
)
router.register(
    r"scanreportvalues",
    deprecated_views.ScanReportValueViewSet,
    basename="scanreportvalues",
)
router.register(
    r"scanreportconcepts",
    deprecated_views.ScanReportConceptViewSet,
    basename="scanreportconcepts",
)
router.register(
    r"scanreportconceptsfilter",
    deprecated_views.ScanReportConceptFilterViewSet,
    basename="scanreportconceptsfilter",
)
router.register(r"omoptables", deprecated_views.OmopTableViewSet, basename="omoptables")
router.register(r"omopfields", deprecated_views.OmopFieldViewSet, basename="omopfields")
