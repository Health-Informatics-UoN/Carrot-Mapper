from django.conf import settings
import os
def react(request):
    return {
        "a": os.environ.get("COCONNECT_DB_AUTH_TOKEN"),
        "u": os.environ.get("CCOM_APP_URL")     
    }