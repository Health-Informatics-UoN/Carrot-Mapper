import json
import logging

import azure.durable_functions as df  # type: ignore
import azure.functions as func


async def main(msg: func.QueueMessage, starter: str):
    client = df.DurableOrchestrationClient(starter)

    msg_body = json.loads(msg.get_body().decode("utf-8"))
    instance_id = msg_body.get("instance_id")

    await client.start_new("RulesOrchestrator", instance_id, msg_body)

    logging.info(f"Started orchestration with ID = '{instance_id}'.")
