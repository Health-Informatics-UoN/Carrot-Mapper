from shared.mapping.models import UploadStatus


def react(request):
    return {
        "upload_status": [
            {"id": id, "label": label} for id, label in UploadStatus.choices
        ],
    }
