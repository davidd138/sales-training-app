import os
import boto3
from datetime import datetime, timezone
from auth_helpers import check_admin_access
from validation import validate_uuid, validate_string, ValidationError

scenarios_table = boto3.resource("dynamodb").Table(os.environ["SCENARIOS_TABLE"])

UPDATABLE_FIELDS = [
    "name", "description", "clientName", "clientTitle",
    "clientCompany", "industry", "difficulty", "persona", "voice",
]


def handler(event, context):
    check_admin_access(event)

    args = event.get("arguments", {}).get("input", {})

    try:
        scenario_id = validate_uuid(args.get("id", ""), "id")
    except ValidationError as e:
        raise Exception(str(e))

    # Verify scenario exists
    scenario = scenarios_table.get_item(Key={"id": scenario_id}).get("Item")
    if not scenario:
        raise Exception("Scenario not found")

    update_parts = []
    expr_values = {}
    for field in UPDATABLE_FIELDS:
        if field in args and args[field] is not None:
            update_parts.append(f"{field} = :{field}")
            expr_values[f":{field}"] = args[field]

    if not update_parts:
        return scenario

    update_parts.append("updatedAt = :ua")
    expr_values[":ua"] = datetime.now(timezone.utc).isoformat()

    scenarios_table.update_item(
        Key={"id": scenario_id},
        UpdateExpression="SET " + ", ".join(update_parts),
        ExpressionAttributeValues=expr_values,
    )

    # Return updated scenario
    for field in UPDATABLE_FIELDS:
        if field in args and args[field] is not None:
            scenario[field] = args[field]

    return scenario
