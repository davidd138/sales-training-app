import os
import json
from collections import defaultdict
import boto3

scores_table = boto3.resource("dynamodb").Table(os.environ["SCORES_TABLE"])
users_table = boto3.resource("dynamodb").Table(os.environ["USERS_TABLE"])


def handler(event, context):
    args = event.get("arguments", {})
    limit = args.get("limit", 10)

    all_scores = scores_table.scan().get("Items", [])

    user_scores = defaultdict(list)
    for s in all_scores:
        uid = s.get("userId", "")
        if uid:
            user_scores[uid].append(float(s.get("overallScore", 0)))

    leaderboard = []
    for uid, scores in user_scores.items():
        avg = round(sum(scores) / len(scores), 1)
        leaderboard.append({
            "userId": uid,
            "averageScore": avg,
            "totalSessions": len(scores),
        })

    leaderboard.sort(key=lambda x: x["averageScore"], reverse=True)
    leaderboard = leaderboard[:limit]

    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1
        user = users_table.get_item(Key={"userId": entry["userId"]}).get("Item")
        entry["userName"] = user.get("name", "Usuario") if user else "Usuario"

    return leaderboard
