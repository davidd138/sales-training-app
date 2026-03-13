import os
import boto3

users_table = boto3.resource("dynamodb").Table(os.environ["USERS_TABLE"])


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    claims = identity.get("claims", {})
    email = claims.get("email", "")

    users_table.put_item(
        Item={
            "userId": user_id,
            "email": email.lower(),
            "name": email.split("@")[0],
            "role": "rep",
        }
    )
    return {"userId": user_id, "email": email, "name": email.split("@")[0], "role": "rep"}
