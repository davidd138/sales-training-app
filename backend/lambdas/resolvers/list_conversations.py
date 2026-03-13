import os
import json
import boto3

conversations_table = boto3.resource("dynamodb").Table(os.environ["CONVERSATIONS_TABLE"])


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    args = event.get("arguments", {})
    limit = args.get("limit", 20)

    query_kwargs = {
        "IndexName": "userId-createdAt-index",
        "KeyConditionExpression": boto3.dynamodb.conditions.Key("userId").eq(user_id),
        "ScanIndexForward": False,
        "Limit": limit,
    }

    next_token = args.get("nextToken")
    if next_token:
        query_kwargs["ExclusiveStartKey"] = json.loads(next_token)

    response = conversations_table.query(**query_kwargs)

    result = {"items": response.get("Items", [])}
    if "LastEvaluatedKey" in response:
        result["nextToken"] = json.dumps(response["LastEvaluatedKey"])

    return result
