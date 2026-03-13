import os
import json
from decimal import Decimal
import boto3

scores_table = boto3.resource("dynamodb").Table(os.environ["SCORES_TABLE"])


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")

    user_scores = scores_table.query(
        IndexName="userId-analyzedAt-index",
        KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
        ScanIndexForward=True,
    ).get("Items", [])

    all_scores = scores_table.scan().get("Items", [])

    user_avg = compute_averages(user_scores)
    team_avg = compute_averages(all_scores)

    all_overalls = [float(s["overallScore"]) for s in all_scores if "overallScore" in s]
    user_overall = user_avg.get("overall", 0)
    percentile = 0
    if all_overalls:
        below = sum(1 for x in all_overalls if x < user_overall)
        percentile = round((below / len(all_overalls)) * 100)

    trend = []
    for s in user_scores[-20:]:
        trend.append({
            "date": s.get("analyzedAt", ""),
            "score": float(s.get("overallScore", 0)),
        })

    return {
        "totalSessions": len(user_scores),
        "averageScore": user_avg.get("overall", 0),
        "percentile": percentile,
        "categoryAverages": json.dumps(user_avg.get("categories", {})),
        "teamCategoryAverages": json.dumps(team_avg.get("categories", {})),
        "trend": json.dumps(trend),
    }


def compute_averages(scores):
    if not scores:
        return {"overall": 0, "categories": {}}

    total_overall = 0
    cat_totals = {}
    cat_counts = {}

    for s in scores:
        total_overall += float(s.get("overallScore", 0))

        cats = s.get("categories", "{}")
        if isinstance(cats, str):
            cats = json.loads(cats)

        for name, data in cats.items():
            score_val = float(data["score"]) if isinstance(data, dict) else float(data)
            cat_totals[name] = cat_totals.get(name, 0) + score_val
            cat_counts[name] = cat_counts.get(name, 0) + 1

    n = len(scores)
    cat_avgs = {}
    for name in cat_totals:
        cat_avgs[name] = round(cat_totals[name] / cat_counts[name], 1)

    return {
        "overall": round(total_overall / n, 1),
        "categories": cat_avgs,
    }
