import json

import azure.durable_functions as df  # type: ignore
import azure.functions as func


async def main(req: func.HttpRequest, starter: str) -> func.HttpResponse:
    """
    A function that returns the status of a given worker instance.

    Args:
        - req (`HttpRequest`): The http request containing the `instance_id`
        - starter (str): The starting context.

    Returns:
        - `HttpResponse` with the worker instance status

    Raises:
        - `400`: No `instance_id` was passed.
        - `404`: A worker with the `instance_id` could not be found.
    """

    instance_id = req.route_params.get("instance_id")

    if not instance_id:
        return func.HttpResponse(
            "Please pass an instance_id in the URL", status_code=400
        )

    client = df.DurableOrchestrationClient(starter)
    status = await client.get_status(instance_id)

    if not status:
        return func.HttpResponse(
            f"Instance with ID '{instance_id}' not found.", status_code=404
        )

    return func.HttpResponse(
        body=json.dumps(status.to_json()), mimetype="application/json", status_code=200
    )
