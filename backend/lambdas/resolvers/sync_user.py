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

    # Get Cognito groups for this user
    groups_resp = cognito.admin_list_groups_for_user(
        UserPoolId=USER_POOL_ID,
        Username=username,
    )
    groups = [g["GroupName"] for g in groups_resp.get("Groups", [])]
    is_admin = "admins" in groups

    # Preserve existing fields if user already exists
    existing = users_table.get_item(Key={"userId": user_id}).get("Item")

    if existing:
        role = "admin" if is_admin else existing.get("role", "rep")
        status = existing.get("status", "active" if is_admin else "pending")
        valid_from = existing.get("validFrom")
        valid_until = existing.get("validUntil")
    else:
        role = "admin" if is_admin else "rep"
        status = "active" if is_admin else "pending"
        valid_from = None
        valid_until = None

    item = {
        "userId": user_id,
        "email": email.lower(),
        "name": name,
        "role": role,
        "status": status,
    }
    if valid_from:
        item["validFrom"] = valid_from
    if valid_until:
        item["validUntil"] = valid_until

    users_table.put_item(Item=item)

    return {
        "userId": user_id,
        "email": email.lower(),
        "name": name,
        "role": role,
        "status": status,
        "validFrom": valid_from,
        "validUntil": valid_until,
        "groups": groups,
    }
