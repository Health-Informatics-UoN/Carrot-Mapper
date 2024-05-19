import json
import logging
import uuid

import azure.functions as func


async def main(
    req: func.HttpRequest, msg: func.Out[str], starter: str
) -> func.HttpResponse:

    msg_body = req.get_json()

    # Create a unique instance ID
    instance_id = str(uuid.uuid4())
    msg_body["instance_id"] = instance_id

    msg.set(json.dumps(msg_body))

    logging.info(f"Queued message with instance ID = '{instance_id}'.")

    # TODO: Can be used to provide the status of the instance.
    status_url = f"{req.url.rstrip('/')}/status/{instance_id}"
    return func.HttpResponse(
        json.dumps({"instanceId": instance_id, "statusQueryGetUri": status_url}),
        status_code=202,
        mimetype="application/json",
    )
