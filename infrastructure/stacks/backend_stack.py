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
    aws_wafv2 as wafv2,
)


class BackendStack(cdk.Stack):
    def __init__(self, scope: Construct, construct_id: str, env_name: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # ---- Pre-signup Lambda (email verification, no auto-confirm) ----
        pre_signup_fn = _lambda.Function(
            self, "PreSignupFn",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="pre_signup.handler",
            code=_lambda.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "..", "..", "backend", "lambdas", "triggers")
            ),
            function_name=f"{env_name}-st-pre-signup",
        )

        # ---- Cognito (hardened) ----
        user_pool = cognito.UserPool(
            self, "UserPool",
            user_pool_name=f"{env_name}-st-users",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=12,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=True,
            ),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=True),
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            lambda_triggers=cognito.UserPoolTriggers(
                pre_sign_up=pre_signup_fn,
            ),
        )

        # Note: 'admins' Cognito group created manually via AWS CLI
        # (CfnUserPoolGroup conflicts with existing group)

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

        # ---- AppSync (Cognito-only auth, no API key) ----
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
            ),
        )

        # ---- WAF for AppSync ----
        waf_acl = wafv2.CfnWebACL(
            self, "ApiWaf",
            scope="REGIONAL",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(allow={}),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name=f"{env_name}-st-api-waf",
            ),
            rules=[
                # Rate limiting: 1000 requests per 5 minutes per IP
                wafv2.CfnWebACL.RuleProperty(
                    name="RateLimit",
                    priority=1,
                    action=wafv2.CfnWebACL.RuleActionProperty(block={}),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        rate_based_statement=wafv2.CfnWebACL.RateBasedStatementProperty(
                            limit=1000,
                            aggregate_key_type="IP",
                        ),
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        sampled_requests_enabled=True,
                        cloud_watch_metrics_enabled=True,
                        metric_name=f"{env_name}-rate-limit",
                    ),
                ),
                # AWS Common Rule Set
                wafv2.CfnWebACL.RuleProperty(
                    name="AWSCommonRules",
                    priority=2,
                    override_action=wafv2.CfnWebACL.OverrideActionProperty(none={}),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesCommonRuleSet",
                        ),
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        sampled_requests_enabled=True,
                        cloud_watch_metrics_enabled=True,
                        metric_name=f"{env_name}-common-rules",
                    ),
                ),
            ],
        )

        # Associate WAF with AppSync
        wafv2.CfnWebACLAssociation(
            self, "ApiWafAssociation",
            resource_arn=api.arn,
            web_acl_arn=waf_acl.attr_arn,
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

        tables = {
            "users": users_table,
            "scenarios": scenarios_table,
            "conversations": conversations_table,
            "scores": scores_table,
            "guidelines": guidelines_table,
        }

        # ---- Helper to create Lambda + AppSync resolver with least-privilege ----
        def create_resolver(
            name: str, type_name: str, field_name: str,
            read_tables: list[str] | None = None,
            write_tables: list[str] | None = None,
            extra_env=None, timeout=30, memory=256,
        ):
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

            # Grant least-privilege table access
            for t_name in (read_tables or []):
                tables[t_name].grant_read_data(fn)
            for t_name in (write_tables or []):
                tables[t_name].grant_read_write_data(fn)

            ds = api.add_lambda_data_source(f"{name}DS", fn)
            ds.create_resolver(
                id=f"{name}Resolver",
                type_name=type_name,
                field_name=field_name,
            )
            return fn

        # ---- Cognito IAM policy (shared by resolvers that need group checks) ----
        cognito_policy = iam.PolicyStatement(
            actions=[
                "cognito-idp:AdminGetUser",
                "cognito-idp:AdminListGroupsForUser",
            ],
            resources=[user_pool.user_pool_arn],
        )

        # ---- Resolvers with least-privilege permissions ----

        # syncUser needs Cognito access + users table write
        sync_user_fn = create_resolver(
            "sync_user", "Mutation", "syncUser",
            write_tables=["users"],
            extra_env={"USER_POOL_ID": user_pool.user_pool_id},
        )
        sync_user_fn.add_to_role_policy(cognito_policy)

        # User-facing resolvers (all need users table read for access checks)
        list_scenarios_fn = create_resolver(
            "list_scenarios", "Query", "listScenarios",
            read_tables=["scenarios", "users"],
        )

        create_conversation_fn = create_resolver(
            "create_conversation", "Mutation", "createConversation",
            read_tables=["scenarios", "users"], write_tables=["conversations"],
        )

        update_conversation_fn = create_resolver(
            "update_conversation", "Mutation", "updateConversation",
            read_tables=["users"], write_tables=["conversations"],
        )

        get_conversation_fn = create_resolver(
            "get_conversation", "Query", "getConversation",
            read_tables=["conversations", "scores", "users"],
        )

        list_conversations_fn = create_resolver(
            "list_conversations", "Query", "listConversations",
            read_tables=["conversations", "users"],
        )

        get_guidelines_fn = create_resolver(
            "get_guidelines", "Query", "getGuidelines",
            read_tables=["guidelines", "users"],
        )

        get_analytics_fn = create_resolver(
            "get_analytics", "Query", "getAnalytics",
            read_tables=["scores", "conversations", "users"],
        )

        get_leaderboard_fn = create_resolver(
            "get_leaderboard", "Query", "getLeaderboard",
            read_tables=["scores", "users"],
        )

        # Realtime token Lambda (Secrets Manager + access check)
        token_fn = create_resolver(
            "get_realtime_token", "Query", "getRealtimeToken",
            read_tables=["users"],
            extra_env={"OPENAI_SECRET_NAME": openai_secret.secret_name},
            timeout=10,
        )
        openai_secret.grant_read(token_fn)

        # Analyze conversation Lambda (Bedrock + multiple tables)
        analyze_fn = create_resolver(
            "analyze_conversation", "Mutation", "analyzeConversation",
            read_tables=["conversations", "scenarios", "guidelines", "users"],
            write_tables=["scores"],
            extra_env={"BEDROCK_MODEL_ID": "amazon.nova-pro-v1:0"},
            timeout=60,
            memory=512,
        )
        analyze_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock:InvokeModel", "bedrock:Converse"],
                resources=[
                    "arn:aws:bedrock:*::foundation-model/anthropic.claude-*",
                    "arn:aws:bedrock:*::foundation-model/amazon.nova-*",
                    f"arn:aws:bedrock:*:{self.account}:inference-profile/us.anthropic.*",
                    f"arn:aws:bedrock:*:{self.account}:inference-profile/eu.anthropic.*",
                ],
            )
        )

        # ---- Admin-only resolvers ----

        # createScenario (admin-only)
        create_scenario_fn = create_resolver(
            "create_scenario", "Mutation", "createScenario",
            read_tables=["users"], write_tables=["scenarios"],
        )
        create_scenario_fn.add_to_role_policy(cognito_policy)

        # updateScenario (admin-only)
        update_scenario_fn = create_resolver(
            "update_scenario", "Mutation", "updateScenario",
            read_tables=["users"], write_tables=["scenarios"],
        )
        update_scenario_fn.add_to_role_policy(cognito_policy)

        # deleteScenario (admin-only)
        delete_scenario_fn = create_resolver(
            "delete_scenario", "Mutation", "deleteScenario",
            read_tables=["users"], write_tables=["scenarios"],
        )
        delete_scenario_fn.add_to_role_policy(cognito_policy)

        # createGuideline (admin-only)
        create_guideline_fn = create_resolver(
            "create_guideline", "Mutation", "createGuideline",
            read_tables=["users"], write_tables=["guidelines"],
        )
        create_guideline_fn.add_to_role_policy(cognito_policy)

        # updateGuideline (admin-only)
        update_guideline_fn = create_resolver(
            "update_guideline", "Mutation", "updateGuideline",
            read_tables=["users"], write_tables=["guidelines"],
        )
        update_guideline_fn.add_to_role_policy(cognito_policy)

        # listAllUsers (admin-only)
        list_all_users_fn = create_resolver(
            "list_all_users", "Query", "listAllUsers",
            read_tables=["users"],
        )
        list_all_users_fn.add_to_role_policy(cognito_policy)

        # updateUserStatus (admin-only)
        update_user_status_fn = create_resolver(
            "update_user_status", "Mutation", "updateUserStatus",
            read_tables=["users"], write_tables=["users"],
        )
        update_user_status_fn.add_to_role_policy(cognito_policy)

        # ---- Exports ----
        self.graphql_url = api.graphql_url
        self.user_pool_id = user_pool.user_pool_id
        self.user_pool_client_id = user_pool_client.user_pool_client_id

        cdk.CfnOutput(self, "GraphQLUrl", value=api.graphql_url, export_name=f"{env_name}-st-graphql-url")
        cdk.CfnOutput(self, "UserPoolId", value=user_pool.user_pool_id, export_name=f"{env_name}-st-user-pool-id")
        cdk.CfnOutput(self, "UserPoolClientId", value=user_pool_client.user_pool_client_id, export_name=f"{env_name}-st-user-pool-client-id")
        cdk.CfnOutput(self, "Region", value=self.region, export_name=f"{env_name}-st-region")
