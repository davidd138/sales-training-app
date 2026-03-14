import os
import boto3
from auth_helpers import check_admin_access
from validation import validate_uuid, ValidationError

scenarios_table = boto3.resource("dynamodb").Table(os.environ["SCENARIOS_TABLE"])


def handler(event, context):
    check_admin_access(event)

    try:
        scenario_id = validate_uuid(event.get("arguments", {}).get("id", ""), "id")
    except ValidationError as e:
        raise Exception(str(e))

    # Verify scenario exists
    scenario = scenarios_table.get_item(Key={"id": scenario_id}).get("Item")
    if not scenario:
        raise Exception("Scenario not found")

    scenarios_table.delete_item(Key={"id": scenario_id})

    return True
