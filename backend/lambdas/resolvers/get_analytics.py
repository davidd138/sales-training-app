import os
import boto3
from boto3.dynamodb.conditions import Key
from auth_helpers import check_user_access

scores_table = boto3.resource("dynamodb").Table(os.environ["SCORES_TABLE"])
conversations_table = boto3.resource("dynamodb").Table(os.environ["CONVERSATIONS_TABLE"])

CATEGORIES = ["rapport", "discovery", "presentation", "objectionHandling", "closing", "communication"]

# Projection attributes needed for team aggregation (avoids reading full items)
_TEAM_PROJECTION = "overallScore, " + ", ".join(CATEGORIES)


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    check_user_access(user_id)

    # --- User's own scores (index query, already efficient) ---
    user_scores = scores_table.query(
        IndexName="userId-analyzedAt-index",
        KeyConditionExpression=Key("userId").eq(user_id),
        ScanIndexForward=True,
    ).get("Items", [])

    # --- Team averages & percentile via paginated scan w/ projection ---
    # TODO: For better scalability, pre-compute team aggregates in a separate
    # DynamoDB aggregation table (e.g. updated by a post-analysis Lambda or
    # DynamoDB Stream). This scan is O(N) on the full scores table.
    team_scores = _scan_all_scores_projected()

    user_avg = compute_averages(user_scores)
    team_avg = compute_averages(team_scores)

    # Percentile: only needs overallScore, already fetched via projection
    all_overalls = [int(s["overallScore"]) for s in team_scores if "overallScore" in s]
    user_overall = user_avg.get("overallScore", 0)
    percentile = 0
    if all_overalls:
        below = sum(1 for x in all_overalls if x < user_overall)
        percentile = round((below / len(all_overalls)) * 100)

    # --- Recent scores: batch-fetch conversations instead of one-by-one ---
    recent_items = user_scores[-20:]
    conv_ids = list({s.get("conversationId", "") for s in recent_items if s.get("conversationId")})
    conv_map = _batch_get_conversations(conv_ids)

    recent = []
    for s in recent_items:
        conv_id = s.get("conversationId", "")
        conv = conv_map.get(conv_id)
        recent.append({
            "conversationId": conv_id,
            "overallScore": int(s.get("overallScore", 0)),
            "date": s.get("analyzedAt", ""),
            "scenarioName": conv.get("scenarioName") if conv else None,
        })

    result = {
        "totalSessions": len(user_scores),
        "avgOverallScore": user_avg.get("overallScore"),
        "percentile": percentile,
        "recentScores": recent,
    }

    for cat in CATEGORIES:
        camel = cat[0].upper() + cat[1:]
        result[f"avg{camel}"] = user_avg.get(cat)
        result[f"teamAvg{camel}"] = team_avg.get(cat)
    result["teamAvgOverallScore"] = team_avg.get("overallScore")

    return result


def _scan_all_scores_projected():
    """Paginated scan fetching only the score attributes needed for aggregation."""
    items = []
    params = {
        "ProjectionExpression": _TEAM_PROJECTION,
    }
    while True:
        response = scores_table.scan(**params)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        params["ExclusiveStartKey"] = last_key
    return items


def _batch_get_conversations(conv_ids):
    """Batch-fetch conversation items by id, returning a dict keyed by id."""
    if not conv_ids:
        return {}

    table_name = conversations_table.table_name
    dynamodb = boto3.resource("dynamodb")
    conv_map = {}

    # BatchGetItem supports max 100 keys per call
    for i in range(0, len(conv_ids), 100):
        batch = conv_ids[i : i + 100]
        keys = [{"id": cid} for cid in batch]
        response = dynamodb.batch_get_item(
            RequestItems={
                table_name: {
                    "Keys": keys,
                    "ProjectionExpression": "id, scenarioName",
                }
            }
        )
        for item in response.get("Responses", {}).get(table_name, []):
            conv_map[item["id"]] = item

        # Handle unprocessed keys (throttling)
        unprocessed = response.get("UnprocessedKeys", {}).get(table_name)
        while unprocessed:
            response = dynamodb.batch_get_item(
                RequestItems={table_name: unprocessed}
            )
            for item in response.get("Responses", {}).get(table_name, []):
                conv_map[item["id"]] = item
            unprocessed = response.get("UnprocessedKeys", {}).get(table_name)

    return conv_map


def compute_averages(scores):
    if not scores:
        return {}

    n = len(scores)
    totals = {"overallScore": 0}
    for cat in CATEGORIES:
        totals[cat] = 0

    for s in scores:
        totals["overallScore"] += int(s.get("overallScore", 0))
        for cat in CATEGORIES:
            totals[cat] += int(s.get(cat, 0))

    return {k: round(v / n) for k, v in totals.items()}
