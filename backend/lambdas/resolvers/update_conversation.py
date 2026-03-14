import os
import boto3
from validation import (
    validate_uuid, validate_enum, validate_positive_int,
    validate_transcript, ValidationError,
)
from auth_helpers import check_user_access

conversations_table = boto3.resource("dynamodb").Table(os.environ["CONVERSATIONS_TABLE"])


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    check_user_access(user_id)
    args = event.get("arguments", {}).get("input", {})

    try:
        conv_id = validate_uuid(args.get("id"), "id")
    except ValidationError as e:
        raise Exception(str(e))

    conv = conversations_table.get_item(Key={"id": conv_id}).get("Item")
    if not conv or conv["userId"] != user_id:
        raise Exception("Not found or unauthorized")

    # Validate optional fields
    try:
        if "status" in args and args["status"] is not None:
            validate_enum(args["status"], "status", ["in_progress", "completed"])
        if "duration" in args and args["duration"] is not None:
            validate_positive_int(args["duration"], "duration")
        if "transcript" in args and args["transcript"] is not None:
            validate_transcript(args["transcript"])
    except ValidationError as e:
        raise Exception(str(e))

    update_expr_parts = []
    expr_values = {}
    expr_names = {}

    for field in ["transcript", "duration", "status", "endedAt"]:
        if field in args and args[field] is not None:
            safe = f"#{field}"
            update_expr_parts.append(f"{safe} = :{field}")
            expr_values[f":{field}"] = args[field]
            expr_names[safe] = field

    if not update_expr_parts:
        return conv

    conversations_table.update_item(
        Key={"id": conv_id},
        UpdateExpression="SET " + ", ".join(update_expr_parts),
        ExpressionAttributeValues=expr_values,
        ExpressionAttributeNames=expr_names,
    )

    conv.update({k: v for k, v in args.items() if v is not None})
    return conv
