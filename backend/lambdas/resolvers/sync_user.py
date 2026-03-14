import os
import boto3

users_table = boto3.resource("dynamodb").Table(os.environ["USERS_TABLE"])
cognito = boto3.client("cognito-idp")
USER_POOL_ID = os.environ["USER_POOL_ID"]


def handler(event, context):
    identity = event.get("identity", {})
    username = identity.get("username", "")
    user_id = identity.get("sub", "") or username

    # Access token doesn't include email — look it up from Cognito
    cognito_user = cognito.admin_get_user(
        UserPoolId=USER_POOL_ID,
        Username=username,
    )
    attrs = {a["Name"]: a["Value"] for a in cognito_user.get("UserAttributes", [])}
    email = attrs.get("email", "")
    name = attrs.get("name", "") or email.split("@")[0]

    if not user_id or not email:
        raise Exception(f"Missing user_id ({user_id!r}) or email ({email!r})")

    # Preserve existing role if user already exists
    existing = users_table.get_item(Key={"userId": user_id}).get("Item")
    role = existing["role"] if existing else "rep"

    users_table.put_item(
        Item={
            "userId": user_id,
            "email": email.lower(),
            "name": name,
            "role": role,
        }
    )
    return {"userId": user_id, "email": email.lower(), "name": name, "role": role}
