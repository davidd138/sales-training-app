import os
import uuid
from datetime import datetime, timezone
import boto3
from validation import validate_uuid, ValidationError
from auth_helpers import check_user_access

conversations_table = boto3.resource("dynamodb").Table(os.environ["CONVERSATIONS_TABLE"])
scenarios_table = boto3.resource("dynamodb").Table(os.environ["SCENARIOS_TABLE"])


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    email = identity.get("claims", {}).get("email", "")

    check_user_access(user_id)

    args = event.get("arguments", {}).get("input", {})

    try:
        scenario_id = validate_uuid(args.get("scenarioId"), "scenarioId")
    except ValidationError as e:
        raise Exception(str(e))

    scenario = scenarios_table.get_item(Key={"id": scenario_id}).get("Item")
    if not scenario:
        raise Exception("Scenario not found")

    item = {
        "id": str(uuid.uuid4()),
        "userId": user_id,
        "userEmail": email,
        "scenarioId": scenario_id,
        "scenarioName": scenario["name"],
        "clientName": scenario["clientName"],
        "transcript": "[]",
        "duration": 0,
        "status": "in_progress",
        "startedAt": datetime.now(timezone.utc).isoformat(),
    }
    conversations_table.put_item(Item=item)
    return item
