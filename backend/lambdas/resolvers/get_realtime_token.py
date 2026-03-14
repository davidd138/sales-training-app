import os
import json
import time
import boto3
from urllib import request
from auth_helpers import check_user_access

secrets_client = boto3.client("secretsmanager")

_cached_key = None
_cached_at = 0
CACHE_TTL = 300


def get_api_key():
    global _cached_key, _cached_at
    now = time.time()
    if _cached_key and (now - _cached_at) < CACHE_TTL:
        return _cached_key
    resp = secrets_client.get_secret_value(SecretId=os.environ["OPENAI_SECRET_NAME"])
    _cached_key = resp["SecretString"]
    _cached_at = now
    return _cached_key


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    check_user_access(user_id)

    api_key = get_api_key()

    body = json.dumps({
        "model": "gpt-4o-realtime-preview",
        "voice": "alloy",
        "modalities": ["audio", "text"],
    }).encode()

    req = request.Request(
        "https://api.openai.com/v1/realtime/sessions",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with request.urlopen(req) as resp:
        data = json.loads(resp.read())

    return {
        "token": data["client_secret"]["value"],
        "expiresAt": data["client_secret"]["expires_at"],
    }
