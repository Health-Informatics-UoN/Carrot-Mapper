import azure.functions as func
from shared.services import refresh_mapping_rules


def main(msg: func.QueueMessage):
    """
    Creates mapping rules.
    Args:
        msg (func.QueueMessage): The message received from the queue.
    """
    # probably the most direct route to do this is to create a shared service
    # and move the shared code to it.
    # then use it only here

    # once we are satisfied it duplicates the legacy behaviour in prod.
    # then we can move all the refresh mapping rules to use the service.
    # TODO: parse message to get table_id
    table_id = 1
    refresh_mapping_rules(table_id)

    return
