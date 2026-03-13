import os
import aws_cdk as cdk
from constructs import Construct
from aws_cdk import (
    aws_cognito as cognito,
    aws_dynamodb as dynamodb,
    aws_appsync as appsync,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_secretsmanager as secretsmanager,
)


class BackendStack(cdk.Stack):
    def __init__(self, scope: Construct, construct_id: str, env_name: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # ---- Pre-signup Lambda (for auto-confirm) ----
        pre_signup_fn = _lambda.Function(
            self, "PreSignupFn",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="pre_signup.handler",
            code=_lambda.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "..", "..", "backend", "lambdas", "triggers")
            ),
            function_name=f"{env_name}-st-pre-signup",
        )

        # ---- Cognito ----
        user_pool = cognito.UserPool(
            self, "UserPool",
            user_pool_name=f"{env_name}-st-users",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
            ),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=True),
            ),
            lambda_triggers=cognito.UserPoolTriggers(
                pre_sign_up=pre_signup_fn,
            ),
        )

        user_pool_client = user_pool.add_client(
            "AppClient",
            user_pool_client_name=f"{env_name}-st-app-client",
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True,
            ),
        )

        # ---- DynamoDB Tables ----
        users_table = dynamodb.Table(
            self, "UsersTable",
            table_name=f"{env_name}-st-users",
            partition_key=dynamodb.Attribute(name="userId", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )
        users_table.add_global_secondary_index(
            index_name="email-index",
            partition_key=dynamodb.Attribute(name="email", type=dynamodb.AttributeType.STRING),
        )

        scenarios_table = dynamodb.Table(
            self, "ScenariosTable",
            table_name=f"{env_name}-st-scenarios",
            partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )

        conversations_table = dynamodb.Table(
            self, "ConversationsTable",
            table_name=f"{env_name}-st-conversations",
            partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )
        conversations_table.add_global_secondary_index(
            index_name="userId-createdAt-index",
            partition_key=dynamodb.Attribute(name="userId", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="startedAt", type=dynamodb.AttributeType.STRING),
        )

        scores_table = dynamodb.Table(
            self, "ScoresTable",
            table_name=f"{env_name}-st-scores",
            partition_key=dynamodb.Attribute(name="conversationId", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )
        scores_table.add_global_secondary_index(
            index_name="userId-analyzedAt-index",
            partition_key=dynamodb.Attribute(name="userId", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="analyzedAt", type=dynamodb.AttributeType.STRING),
        )

        guidelines_table = dynamodb.Table(
            self, "GuidelinesTable",
            table_name=f"{env_name}-st-guidelines",
            partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )

        # ---- Secrets Manager ----
        openai_secret = secretsmanager.Secret(
            self, "OpenAISecret",
            secret_name=f"{env_name}/openai-api-key",
            description="OpenAI API Key for Realtime voice sessions",
        )

        # ---- AppSync ----
        api = appsync.GraphqlApi(
            self, "Api",
            name=f"{env_name}-st-api",
            definition=appsync.Definition.from_file(
                os.path.join(os.path.dirname(__file__), "..", "..", "backend", "schema", "schema.graphql")
            ),
            authorization_config=appsync.AuthorizationConfig(
                default_authorization=appsync.AuthorizationMode(
                    authorization_type=appsync.AuthorizationType.USER_POOL,
                    user_pool_config=appsync.UserPoolConfig(user_pool=user_pool),
                ),
                additional_authorization_modes=[
                    appsync.AuthorizationMode(
                        authorization_type=appsync.AuthorizationType.API_KEY,
                        api_key_config=appsync.ApiKeyConfig(
                            expires=cdk.Expiration.after(cdk.Duration.days(365)),
                        ),
                    ),
                ],
            ),
        )

        # ---- Common Lambda environment ----
        common_env = {
            "USERS_TABLE": users_table.table_name,
            "SCENARIOS_TABLE": scenarios_table.table_name,
            "CONVERSATIONS_TABLE": conversations_table.table_name,
            "SCORES_TABLE": scores_table.table_name,
            "GUIDELINES_TABLE": guidelines_table.table_name,
            "ENV_NAME": env_name,
        }

        # ---- Helper to create Lambda + AppSync resolver ----
        def create_resolver(name: str, type_name: str, field_name: str, extra_env=None, timeout=30, memory=256):
            env = {**common_env, **(extra_env or {})}
            fn = _lambda.Function(
                self, f"{name}Fn",
                runtime=_lambda.Runtime.PYTHON_3_11,
                handler=f"{name}.handler",
                code=_lambda.Code.from_asset(
                    os.path.join(os.path.dirname(__file__), "..", "..", "backend", "lambdas", "resolvers")
                ),
                function_name=f"{env_name}-st-{name.replace('_', '-')}",
                environment=env,
                timeout=cdk.Duration.seconds(timeout),
                memory_size=memory,
            )

            # Grant table access
            for table in [users_table, scenarios_table, conversations_table, scores_table, guidelines_table]:
                table.grant_read_write_data(fn)

            ds = api.add_lambda_data_source(f"{name}DS", fn)
            ds.create_resolver(
                id=f"{name}Resolver",
                type_name=type_name,
                field_name=field_name,
            )
            return fn

        # ---- Resolvers ----
        create_resolver("sync_user", "Mutation", "syncUser")
        create_resolver("list_scenarios", "Query", "listScenarios")
        create_resolver("create_scenario", "Mutation", "createScenario")
        create_resolver("create_conversation", "Mutation", "createConversation")
        create_resolver("update_conversation", "Mutation", "updateConversation")
        create_resolver("get_conversation", "Query", "getConversation")
        create_resolver("list_conversations", "Query", "listConversations")
        create_resolver("get_guidelines", "Query", "getGuidelines")
        create_resolver("create_guideline", "Mutation", "createGuideline")
        create_resolver("update_guideline", "Mutation", "updateGuideline")
        create_resolver("get_analytics", "Query", "getAnalytics")
        create_resolver("get_leaderboard", "Query", "getLeaderboard")

        # Realtime token Lambda (needs Secrets Manager access)
        token_fn = create_resolver(
            "get_realtime_token", "Query", "getRealtimeToken",
            extra_env={"OPENAI_SECRET_NAME": openai_secret.secret_name},
            timeout=10,
        )
        openai_secret.grant_read(token_fn)

        # Analyze conversation Lambda (needs Bedrock access)
        analyze_fn = create_resolver(
            "analyze_conversation", "Mutation", "analyzeConversation",
            timeout=60,
            memory=512,
        )
        analyze_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock:InvokeModel"],
                resources=["*"],
            )
        )

        # ---- Outputs ----
        cdk.CfnOutput(self, "GraphQLUrl", value=api.graphql_url, export_name=f"{env_name}-st-graphql-url")
        cdk.CfnOutput(self, "GraphQLApiKey", value=api.api_key or "", export_name=f"{env_name}-st-graphql-api-key")
        cdk.CfnOutput(self, "UserPoolId", value=user_pool.user_pool_id, export_name=f"{env_name}-st-user-pool-id")
        cdk.CfnOutput(self, "UserPoolClientId", value=user_pool_client.user_pool_client_id, export_name=f"{env_name}-st-user-pool-client-id")
        cdk.CfnOutput(self, "Region", value=self.region, export_name=f"{env_name}-st-region")
