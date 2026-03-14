import os
from datetime import datetime, timezone
import boto3
from auth_helpers import check_admin_access

guidelines_table = boto3.resource("dynamodb").Table(os.environ["GUIDELINES_TABLE"])


def handler(event, context):
    check_admin_access(event)
    args = event.get("arguments", {}).get("input", {})
    guideline_id = args["id"]

    item = guidelines_table.get_item(Key={"id": guideline_id}).get("Item")
    if not item:
        raise Exception("Guideline not found")

    update_parts = ["#updatedAt = :updatedAt"]
    values = {":updatedAt": datetime.now(timezone.utc).isoformat()}
    names = {"#updatedAt": "updatedAt"}

    for field in ["title", "content", "isActive"]:
        if field in args and args[field] is not None:
            update_parts.append(f"#{field} = :{field}")
            values[f":{field}"] = args[field]
            names[f"#{field}"] = field

    guidelines_table.update_item(
        Key={"id": guideline_id},
        UpdateExpression="SET " + ", ".join(update_parts),
        ExpressionAttributeValues=values,
        ExpressionAttributeNames=names,
    )

    item.update({k: v for k, v in args.items() if v is not None})
    item["updatedAt"] = values[":updatedAt"]
    return item
