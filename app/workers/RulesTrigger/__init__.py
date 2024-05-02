import logging

import azure.durable_functions as df  # type: ignore
import azure.functions as func


async def main(req: func.HttpRequest, starter: str) -> func.HttpResponse:
    client = df.DurableOrchestrationClient(starter)

    msg = req.get_json()

    instance_id = await client.start_new(req.route_params["functionName"], None, msg)

    logging.info(f"Started orchestration with ID = '{instance_id}'.")

    return client.create_check_status_response(req, instance_id)
