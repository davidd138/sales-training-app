"""Shared authorization helpers for Lambda resolvers."""
import os
from datetime import datetime, timezone
import boto3

users_table = boto3.resource("dynamodb").Table(os.environ["USERS_TABLE"])


def check_user_access(user_id: str) -> dict:
    """Check that a user exists, is active, and within their access period.

    Returns the user item if access is granted.
    Raises Exception if access is denied.
    """
    user = users_table.get_item(Key={"userId": user_id}).get("Item")
    if not user:
        raise Exception("Access denied: user not found")

    status = user.get("status", "pending")

    # Admins always have access
    if user.get("role") == "admin":
        return user

    if status == "pending":
        raise Exception("Access denied: your account is pending approval by an administrator")
    if status == "suspended":
        raise Exception("Access denied: your account has been suspended")
    if status == "expired":
        raise Exception("Access denied: your access has expired, contact your professor")

    if status == "active":
        # Check temporal access window
        now = datetime.now(timezone.utc).isoformat()
        valid_from = user.get("validFrom")
        valid_until = user.get("validUntil")

        if valid_from and now < valid_from:
            raise Exception("Access denied: your access period has not started yet")
        if valid_until and now > valid_until:
            # Auto-expire the user
            users_table.update_item(
                Key={"userId": user_id},
                UpdateExpression="SET #s = :s",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={":s": "expired"},
            )
            raise Exception("Access denied: your access has expired, contact your professor")

    return user


def _get_groups_from_event(event: dict) -> list:
    """Extract Cognito groups from the AppSync identity object.

    AppSync passes groups in different places depending on auth mode:
    - identity.claims["cognito:groups"] (most common)
    - identity.groups (some configurations)
    """
    identity = event.get("identity", {})
    claims = identity.get("claims", {})

    groups = claims.get("cognito:groups", [])
    if not groups:
        groups = identity.get("groups", [])
    if isinstance(groups, str):
        groups = [groups]
    return groups


def check_admin_access(event: dict) -> dict:
    """Check that the caller is an admin user.

    Returns the user item if admin access is granted.
    Raises Exception if not an admin.
    """
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")

    groups = _get_groups_from_event(event)

    # Primary check: Cognito groups
    is_admin_by_group = "admins" in groups

    # Get user from DB
    user = users_table.get_item(Key={"userId": user_id}).get("Item")
    if not user:
        raise Exception("Access denied: user not found")

    # Check admin access via Cognito group OR user role in DB
    if not is_admin_by_group and user.get("role") != "admin":
        raise Exception("Access denied: admin privileges required")

    return user
