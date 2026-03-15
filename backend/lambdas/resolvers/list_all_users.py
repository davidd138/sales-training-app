import os
import boto3
from auth_helpers import check_admin_access

users_table = boto3.resource("dynamodb").Table(os.environ["USERS_TABLE"])


def handler(event, context):
    check_admin_access(event)

    response = users_table.scan()
    items = response.get("Items", [])

    # Handle pagination for large user bases
    while "LastEvaluatedKey" in response:
        response = users_table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))

    # Ensure all required fields have defaults and filter out invalid items
    valid_items = []
    for item in items:
        item.setdefault("email", item.get("userId", "unknown"))
        item.setdefault("name", item.get("email", "").split("@")[0])
        item.setdefault("role", "rep")
        item.setdefault("status", "pending")
        item.setdefault("validFrom", None)
        item.setdefault("validUntil", None)
        item.setdefault("groups", [])
        # Only include items that have a userId
        if item.get("userId"):
            valid_items.append(item)
    items = valid_items

    # Sort: pending first, then by email
    status_order = {"pending": 0, "active": 1, "suspended": 2, "expired": 3}
    items.sort(key=lambda x: (status_order.get(x.get("status", "pending"), 9), x.get("email", "")))

    return {"items": items}
