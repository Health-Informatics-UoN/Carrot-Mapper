from typing import Dict

import azure.durable_functions as df


def orchestrator_function(context: df.DurableOrchestrationContext):

    # CreateConcepts
    msg = context.get_input()
    result1 = yield context.call_activity("CreateConcepts", msg)

    # Get concepts ?

    # Fan out.

    return [result1]


main = df.Orchestrator.create(orchestrator_function)
