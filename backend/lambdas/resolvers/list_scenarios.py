import os
import boto3
from auth_helpers import check_user_access

scenarios_table = boto3.resource("dynamodb").Table(os.environ["SCENARIOS_TABLE"])


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    check_user_access(user_id)

    response = scenarios_table.scan()
    return response.get("Items", [])
