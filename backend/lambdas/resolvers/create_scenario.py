import os
import uuid
from datetime import datetime, timezone
import boto3

scenarios_table = boto3.resource("dynamodb").Table(os.environ["SCENARIOS_TABLE"])


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    args = event.get("arguments", {}).get("input", {})

    item = {
        "id": str(uuid.uuid4()),
        "name": args["name"],
        "description": args["description"],
        "clientName": args["clientName"],
        "clientTitle": args["clientTitle"],
        "clientCompany": args["clientCompany"],
        "industry": args["industry"],
        "difficulty": args["difficulty"],
        "persona": args["persona"],
        "createdBy": user_id,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    scenarios_table.put_item(Item=item)
    return item
