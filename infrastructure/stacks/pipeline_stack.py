import aws_cdk as cdk
from constructs import Construct
from aws_cdk.pipelines import CodePipeline, CodePipelineSource, ShellStep
from stages.app_stage import AppStage


class PipelineStack(cdk.Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        connection_arn = "arn:aws:codestar-connections:eu-west-1:890742600627:connection/e879a2a6-c2f1-4128-9bfb-996a0a5b3c7d"

        source = CodePipelineSource.connection(
            "davidd138/sales-training-app",
            "main",
            connection_arn=connection_arn,
        )

        pipeline = CodePipeline(
            self,
            "Pipeline",
            pipeline_name="sales-training-pipeline",
            synth=ShellStep(
                "Synth",
                input=source,
                install_commands=[
                    "pip install -r infrastructure/requirements.txt",
                    # Install Node.js 20 for frontend build
                    "n 20",
                    "cd frontend && npm ci",
                ],
                commands=[
                    # Build frontend static export
                    "cd frontend && npm run build",
                    # Synth CDK
                    "cd infrastructure && npx cdk synth",
                ],
                primary_output_directory="infrastructure/cdk.out",
            ),
        )

        pipeline.add_stage(
            AppStage(
                self,
                "SalesTrainingDev",
                env_name="dev",
                env=cdk.Environment(
                    account="890742600627",
                    region="eu-west-1",
                ),
            )
        )
