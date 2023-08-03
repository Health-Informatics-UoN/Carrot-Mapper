import json
import logging
import os

from collections import defaultdict
from datetime import datetime

import asyncio
import httpx
import requests
import azure.functions as func

from requests.models import HTTPError
from shared_code import omop_helpers

logger = logging.getLogger("test_logger")

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(
    logging.Formatter(
        fmt="%(asctime)s - %(levelname)s - %(message)s", datefmt="%d/%m/%Y " "%H:%M:%S"
    )
)
logger.addHandler(stream_handler)
logger.setLevel(logging.INFO)  # Set to logging.DEBUG to show the debug output

# Set up ccom API parameters:
API_URL = os.environ.get("APP_URL") + "api/"
HEADERS = {
    "Content-type": "application/json",
    "charset": "utf-8",
    "Authorization": f"Token {os.environ.get('AZ_FUNCTION_KEY')}",
}

def main(msg: func.QueueMessage) -> None:
    body= msg.get_body().decode("utf-8")
    body= json.loads(body)
    SR_ID= body["scan_report_id"]
    url=API_URL + "mappingrulesfilter/?scan_report=" + str(SR_ID) +'&fields=id'
    # logging.info(url)

# def main(msg: func.QueueMessage) -> None:
#     logging.info('Python queue trigger function processed a queue item: %s',
#                  msg.get_body().decode('utf-8'))

    get_mappingrules_response = requests.get(
            url=url,
            headers=HEADERS,
        )
    
    logging.info(get_mappingrules_response.json())
