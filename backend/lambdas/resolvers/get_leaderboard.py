import os
from collections import defaultdict
import boto3
from auth_helpers import check_user_access

scores_table = boto3.resource("dynamodb").Table(os.environ["SCORES_TABLE"])
users_table = boto3.resource("dynamodb").Table(os.environ["USERS_TABLE"])


def handler(event, context):
    identity = event.get("identity", {})
    user_id = identity.get("sub", "")
    check_user_access(user_id)
    all_scores = scores_table.scan().get("Items", [])

    user_scores = defaultdict(list)
    for s in all_scores:
        uid = s.get("userId", "")
        if uid:
            user_scores[uid].append(int(s.get("overallScore", 0)))

    entries = []
    for uid, scores in user_scores.items():
        avg = round(sum(scores) / len(scores))
        user = users_table.get_item(Key={"userId": uid}).get("Item")
        entries.append({
            "userId": uid,
            "email": user.get("email", "") if user else "",
            "name": user.get("name") if user else None,
            "avgScore": avg,
            "totalSessions": len(scores),
        })

    entries.sort(key=lambda x: x["avgScore"], reverse=True)

    return {"entries": entries[:20]}
