import os
import boto3

conversations_table = boto3.resource("dynamodb").Table(os.environ["CONVERSATIONS_TABLE"])


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    args = event.get("arguments", {}).get("input", {})

    conv = conversations_table.get_item(Key={"id": args["id"]}).get("Item")
    if not conv or conv["userId"] != user_id:
        raise Exception("Not found or unauthorized")

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
        Key={"id": args["id"]},
        UpdateExpression="SET " + ", ".join(update_expr_parts),
        ExpressionAttributeValues=expr_values,
        ExpressionAttributeNames=expr_names,
    )

    conv.update({k: v for k, v in args.items() if v is not None})
    return conv
