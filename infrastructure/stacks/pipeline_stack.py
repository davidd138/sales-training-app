import aws_cdk as cdk
from constructs import Construct
from aws_cdk import aws_iam as iam
from aws_cdk.pipelines import CodePipeline, CodePipelineSource, ShellStep, CodeBuildStep
from stages.app_stage import AppStage


class PipelineStack(cdk.Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        connection_arn = "arn:aws:codestar-connections:eu-west-1:890742600627:connection/e879a2a6-c2f1-4128-9bfb-996a0a5b3c7d"

        source = CodePipelineSource.connection(
            "davidd138/sales-training-app",
            "main",
            connection_arn=connection_arn,
            trigger_on_push=True,
        )

        synth_step = ShellStep(
            "Synth",
            input=source,
            install_commands=[
                "pip install -r infrastructure/requirements.txt",
            ],
            commands=[
                "cd infrastructure && npx cdk synth",
            ],
            primary_output_directory="infrastructure/cdk.out",
        )

        pipeline = CodePipeline(
            self,
            "Pipeline",
            pipeline_name="sales-training-pipeline",
            synth=synth_step,
        )

        stage = pipeline.add_stage(
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

        # Deploy frontend to S3 after CDK deploy
        stage.add_post(
            CodeBuildStep(
                "DeployFrontend",
                input=source,
                commands=[
                    "n 20",
                    "cd frontend && npm ci && npm run build",
                    "aws s3 sync out/ s3://dev-st-frontend-890742600627/ --delete",
                    'DIST_ID=$(aws cloudformation describe-stacks --stack-name SalesTrainingDev-FrontendStack --query "Stacks[0].Outputs[?OutputKey==\'DistributionId\'].OutputValue" --output text --region eu-west-1)',
                    'aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" --region eu-west-1',
                ],
                role_policy_statements=[
                    iam.PolicyStatement(
                        actions=["s3:ListBucket", "s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                        resources=[
                            "arn:aws:s3:::dev-st-frontend-890742600627",
                            "arn:aws:s3:::dev-st-frontend-890742600627/*",
                        ],
                    ),
                    iam.PolicyStatement(
                        actions=["cloudformation:DescribeStacks"],
                        resources=["arn:aws:cloudformation:eu-west-1:890742600627:stack/SalesTrainingDev-FrontendStack/*"],
                    ),
                    iam.PolicyStatement(
                        actions=["cloudfront:CreateInvalidation"],
                        resources=["*"],
                    ),
                ],
            )
        )
