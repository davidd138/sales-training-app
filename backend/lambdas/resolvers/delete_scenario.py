import os
import boto3
from auth_helpers import check_admin_access
from audit_helpers import log_admin_action
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

    admin_id = event.get("identity", {}).get("sub", "unknown")
    log_admin_action(admin_id, "DELETE_SCENARIO", scenario_id, {"name": scenario.get("name", "")})

    return True
