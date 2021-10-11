from django.conf import settings
import os
from mapping.models import Status
def react(request):
    return {
        "a": os.environ.get("COCONNECT_DB_AUTH_TOKEN"),
        "u": os.environ.get("CCOM_APP_URL"),   
        "status":[{'id': id, 'label': label} for id, label in Status.choices]
    }