import os
import boto3
from auth_helpers import check_user_access

scores_table = boto3.resource("dynamodb").Table(os.environ["SCORES_TABLE"])
conversations_table = boto3.resource("dynamodb").Table(os.environ["CONVERSATIONS_TABLE"])

CATEGORIES = ["rapport", "discovery", "presentation", "objectionHandling", "closing"]


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    check_user_access(user_id)

    user_scores = scores_table.query(
        IndexName="userId-analyzedAt-index",
        KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
        ScanIndexForward=True,
    ).get("Items", [])

    all_scores = scores_table.scan().get("Items", [])

    user_avg = compute_averages(user_scores)
    team_avg = compute_averages(all_scores)

    all_overalls = [int(s["overallScore"]) for s in all_scores if "overallScore" in s]
    user_overall = user_avg.get("overallScore", 0)
    percentile = 0
    if all_overalls:
        below = sum(1 for x in all_overalls if x < user_overall)
        percentile = round((below / len(all_overalls)) * 100)

    recent = []
    for s in user_scores[-20:]:
        conv_id = s.get("conversationId", "")
        scenario_name = None
        if conv_id:
            conv = conversations_table.get_item(Key={"id": conv_id}).get("Item")
            if conv:
                scenario_name = conv.get("scenarioName")
        recent.append({
            "conversationId": conv_id,
            "overallScore": int(s.get("overallScore", 0)),
            "date": s.get("analyzedAt", ""),
            "scenarioName": scenario_name,
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
