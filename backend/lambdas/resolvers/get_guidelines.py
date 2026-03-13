import os
import boto3

guidelines_table = boto3.resource("dynamodb").Table(os.environ["GUIDELINES_TABLE"])


def handler(event, context):
    response = guidelines_table.scan()
    return response.get("Items", [])
