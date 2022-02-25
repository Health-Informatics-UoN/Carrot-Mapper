from django.conf import settings
import os
from mapping.models import Status


def react(request):
    # TODO: this doesn't seem like the right to pass the token to React.
    # It should probably be done in a cookie. But it's beyond the scope
    # of the current work for now.
    return {
        # "a": os.environ.get("COCONNECT_DB_AUTH_TOKEN")
        "a": getattr(request.user, "auth_token", ""),
        "u": os.environ.get("CCOM_APP_URL"),
        "status": [{"id": id, "label": label} for id, label in Status.choices],
    }
