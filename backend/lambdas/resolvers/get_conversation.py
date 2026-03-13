import os
import boto3

conversations_table = boto3.resource("dynamodb").Table(os.environ["CONVERSATIONS_TABLE"])
scores_table = boto3.resource("dynamodb").Table(os.environ["SCORES_TABLE"])


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    conv_id = event.get("arguments", {}).get("id", "")

    conv = conversations_table.get_item(Key={"id": conv_id}).get("Item")
    if not conv or conv["userId"] != user_id:
        raise Exception("Not found or unauthorized")

    score = scores_table.get_item(Key={"conversationId": conv_id}).get("Item")

    return {"conversation": conv, "score": score}
