from django.conf import settings
import os
from mapping.models import Status
def react(request):
    return {
        "a": os.environ.get("COCONNECT_DB_AUTH_TOKEN"),
        "u": os.environ.get("CCOM_APP_URL"),   
        "status":[{'id': year[0], 'label': year[1]} for year in Status.choices]
    }