import os
import boto3

scenarios_table = boto3.resource("dynamodb").Table(os.environ["SCENARIOS_TABLE"])


def handler(event, context):
    response = scenarios_table.scan()
    return response.get("Items", [])
