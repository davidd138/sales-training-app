import os
import boto3
from auth_helpers import check_admin_access
from validation import validate_uuid, validate_enum, ValidationError

users_table = boto3.resource("dynamodb").Table(os.environ["USERS_TABLE"])

VALID_STATUSES = ["pending", "active", "suspended", "expired"]


def handler(event, context):
    check_admin_access(event)

    args = event.get("arguments", {}).get("input", {})

    try:
        user_id = validate_uuid(args.get("userId", ""), "userId")
        status = validate_enum(args.get("status", ""), "status", VALID_STATUSES)
    except ValidationError as e:
        raise Exception(str(e))

    valid_from = args.get("validFrom")
    valid_until = args.get("validUntil")

    # Verify user exists
    user = users_table.get_item(Key={"userId": user_id}).get("Item")
    if not user:
        raise Exception("User not found")

    update_expr_parts = ["#s = :s"]
    expr_names = {"#s": "status"}
    expr_values = {":s": status}

    if valid_from is not None:
        update_expr_parts.append("validFrom = :vf")
        expr_values[":vf"] = valid_from

    if valid_until is not None:
        update_expr_parts.append("validUntil = :vu")
        expr_values[":vu"] = valid_until

    users_table.update_item(
        Key={"userId": user_id},
        UpdateExpression="SET " + ", ".join(update_expr_parts),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )

    # Return updated user
    user["status"] = status
    if valid_from is not None:
        user["validFrom"] = valid_from
    if valid_until is not None:
        user["validUntil"] = valid_until
    user.setdefault("groups", [])

    return user
