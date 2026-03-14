#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.backend_stack import BackendStack

app = cdk.App()

# Deploy backend directly for development
BackendStack(
    app,
    "sales-training-dev",
    env_name="dev",
    env=cdk.Environment(
        account="890742600627",
        region="eu-west-1",
    ),
)

app.synth()
