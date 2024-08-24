from api import views
from rest_framework import routers

router = routers.DefaultRouter()

router.register(
    r"v2/omop/conceptsfilter", views.ConceptFilterViewSetV2, basename="v2conceptsfilter"
)
