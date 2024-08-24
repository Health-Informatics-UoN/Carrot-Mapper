from api import views
from rest_framework import routers

router = routers.DefaultRouter()

router.register(
    r"v2/omop/conceptsfilter", views.ConceptFilterViewSetV2, basename="v2conceptsfilter"
)

router.register(r"v2/users", views.UserViewSet, basename="users")
router.register(r"v2/usersfilter", views.UserFilterViewSet, basename="usersfilter")
router.register(r"v2/datapartners", views.DataPartnerViewSet, basename="datapartners")
