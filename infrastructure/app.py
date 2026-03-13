#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.pipeline_stack import PipelineStack

app = cdk.App()

PipelineStack(
    app,
    "sales-training-pipeline",
    env=cdk.Environment(
        account="890742600627",
        region="eu-west-1",
    ),
)

app.synth()
