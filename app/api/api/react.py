from shared.models import Status


def react(request):
    return {
        "status": [{"id": id, "label": label} for id, label in Status.choices],
    }
