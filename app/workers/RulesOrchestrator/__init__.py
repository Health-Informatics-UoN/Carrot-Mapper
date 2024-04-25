import json
import logging

import azure.durable_functions as df
import azure.functions as func


def orchestrator_function(context: df.DurableOrchestrationContext):
    result1 = yield context.call_activity("RulesActivity", "Tokyo")
    result2 = yield context.call_activity("RulesActivity", "Seattle")
    result3 = yield context.call_activity("RulesActivity", "London")
    return [result1, result2, result3]


main = df.Orchestrator.create(orchestrator_function)
