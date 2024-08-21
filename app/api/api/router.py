from api import views
from rest_framework import routers

router = routers.DefaultRouter()

router.register(
    r"v2/omop/conceptsfilter", views.ConceptFilterViewSetV2, basename="v2conceptsfilter"
)

router.register(r"users", views.UserViewSet, basename="users")
router.register(r"usersfilter", views.UserFilterViewSet, basename="usersfilter")
router.register(
    r"v2/scanreportconcept",
    views.ScanReportConceptViewSetV2,
    basename="v2scanreportconcept",
)
router.register(
    r"v2/scanreportconceptsfilter",
    views.ScanReportConceptFilterViewSetV2,
    basename="v2scanreportconceptsfilter",
)
router.register(r"datapartners", views.DataPartnerViewSet, basename="datapartners")
router.register(r"mappingruleslist", views.RulesList, basename="getlist")
router.register(
    r"mappingruleslistsummary", views.SummaryRulesList, basename="getsummarylist"
)
router.register(r"analyse", views.AnalyseRules, basename="getanalysis")
