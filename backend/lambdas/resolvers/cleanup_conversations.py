"""Cleanup stale in_progress conversations.

This can be invoked manually or scheduled via CloudWatch Events.
Marks conversations that have been in_progress for more than 2 hours as 'abandoned'.
"""
import os
import boto3
from datetime import datetime, timezone, timedelta

conversations_table = boto3.resource("dynamodb").Table(os.environ.get("CONVERSATIONS_TABLE", "dev-st-conversations"))

STALE_THRESHOLD_MINUTES = 10


def handler(event, context):
    """Find and mark stale in_progress conversations as abandoned."""
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=STALE_THRESHOLD_MINUTES)).isoformat()

    # Scan for in_progress conversations (could use GSI for better performance)
    response = conversations_table.scan(
        FilterExpression=boto3.dynamodb.conditions.Attr("status").eq("in_progress"),
        ProjectionExpression="id, userId, startedAt, #s",
        ExpressionAttributeNames={"#s": "status"},
    )

    stale_count = 0
    items = response.get("Items", [])

    for item in items:
        started_at = item.get("startedAt", "")
        if started_at and started_at < cutoff:
            # This conversation has been in_progress for too long - mark as abandoned
            conversations_table.update_item(
                Key={"id": item["id"]},
                UpdateExpression="SET #s = :s, endedAt = :e",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":s": "abandoned",
                    ":e": datetime.now(timezone.utc).isoformat(),
                },
            )
            stale_count += 1
            print(f"Marked as abandoned: {item['id']} (started: {started_at})")

    result = {
        "scanned": len(items),
        "abandoned": stale_count,
        "cutoff": cutoff,
    }
    print(f"Cleanup complete: {result}")
    return result
