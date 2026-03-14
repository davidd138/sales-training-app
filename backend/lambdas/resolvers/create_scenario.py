import os
import uuid
from datetime import datetime, timezone
import boto3
from auth_helpers import check_admin_access
from audit_helpers import log_admin_action

scenarios_table = boto3.resource("dynamodb").Table(os.environ["SCENARIOS_TABLE"])


def handler(event, context):
    check_admin_access(event)

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
        "voice": args.get("voice", "coral"),
        "createdBy": user_id,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    scenarios_table.put_item(Item=item)

    log_admin_action(user_id, "CREATE_SCENARIO", item["id"], {"name": item["name"]})

    return item
