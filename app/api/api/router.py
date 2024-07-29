from api import views
from rest_framework import routers

router = routers.DefaultRouter()


router.register(r"omop/concepts", views.ConceptViewSet, basename="concepts")
router.register(
    r"omop/conceptsfilter", views.ConceptFilterViewSet, basename="conceptsfilter"
)
router.register(
    r"v2/omop/conceptsfilter", views.ConceptFilterViewSetV2, basename="v2conceptsfilter"
)

router.register(r"users", views.UserViewSet, basename="users")
router.register(r"usersfilter", views.UserFilterViewSet, basename="usersfilter")

router.register(r"scanreports", views.ScanReportListViewSet, basename="scanreports")
router.register(
    r"v2/scanreports", views.ScanReportListViewSetV2, basename="v2scanreports"
)
router.register(
    r"scanreporttables", views.ScanReportTableViewSet, basename="scanreporttables"
)
router.register(
    r"v2/scanreporttables",
    views.ScanReportTableViewSetV2,
    basename="v2scanreporttables",
)

router.register(
    r"scanreportfields", views.ScanReportFieldViewSet, basename="scanreportfields"
)
router.register(
    r"v2/scanreportfields",
    views.ScanReportFieldViewSetV2,
    basename="v2scanreportfields",
)
router.register(
    r"scanreportvalues", views.ScanReportValueViewSet, basename="scanreportvalues"
)
router.register(
    r"v2/scanreportvalues",
    views.ScanReportValueViewSetV2,
    basename="v2scanreportvalues",
)
router.register(
    r"scanreportconcepts", views.ScanReportConceptViewSet, basename="scanreportconcepts"
)
router.register(
    r"v2/scanreportconcept",
    views.ScanReportConceptViewSetV2,
    basename="v2scanreportconcept",
)
router.register(
    r"scanreportconceptsfilter",
    views.ScanReportConceptFilterViewSet,
    basename="scanreportconceptsfilter",
)
router.register(
    r"v2/scanreportconceptsfilter",
    views.ScanReportConceptFilterViewSetV2,
    basename="v2scanreportconceptsfilter",
)

router.register(r"datapartners", views.DataPartnerViewSet, basename="datapartners")
router.register(
    r"datapartnersfilter", views.DataPartnerFilterViewSet, basename="datapartnersfilter"
)

router.register(r"omoptables", views.OmopTableViewSet, basename="omoptables")
router.register(r"omopfields", views.OmopFieldViewSet, basename="omopfields")

router.register(r"mappingrules", views.MappingRuleViewSet, basename="mappingrule")
router.register(r"mappingruleslist", views.RulesList, basename="getlist")
router.register(
    r"mappingruleslistsummary", views.SummaryRulesList, basename="getsummarylist"
)
router.register(r"analyse", views.AnalyseRules, basename="getanalysis")
