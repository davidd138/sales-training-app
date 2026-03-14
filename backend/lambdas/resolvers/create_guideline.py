import os
import uuid
from datetime import datetime, timezone
import boto3
from auth_helpers import check_admin_access

guidelines_table = boto3.resource("dynamodb").Table(os.environ["GUIDELINES_TABLE"])


def handler(event, context):
    check_admin_access(event)
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    args = event.get("arguments", {}).get("input", {})

    now = datetime.now(timezone.utc).isoformat()
    item = {
        "id": str(uuid.uuid4()),
        "title": args["title"],
        "content": args["content"],
        "isActive": True,
        "createdBy": user_id,
        "createdAt": now,
        "updatedAt": now,
    }
    guidelines_table.put_item(Item=item)
    return item
