import os
import uuid
from datetime import datetime, timezone
import boto3

conversations_table = boto3.resource("dynamodb").Table(os.environ["CONVERSATIONS_TABLE"])
scenarios_table = boto3.resource("dynamodb").Table(os.environ["SCENARIOS_TABLE"])


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    email = identity.get("claims", {}).get("email", "")
    args = event.get("arguments", {}).get("input", {})

    scenario = scenarios_table.get_item(Key={"id": args["scenarioId"]}).get("Item")
    scenario_name = scenario["name"] if scenario else ""
    client_name = scenario["clientName"] if scenario else ""

    item = {
        "id": str(uuid.uuid4()),
        "userId": user_id,
        "userEmail": email,
        "scenarioId": args["scenarioId"],
        "scenarioName": scenario_name,
        "clientName": client_name,
        "transcript": "[]",
        "duration": 0,
        "status": "in_progress",
        "startedAt": datetime.now(timezone.utc).isoformat(),
    }
    conversations_table.put_item(Item=item)
    return item
