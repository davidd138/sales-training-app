import aws_cdk as cdk
from constructs import Construct
from stacks.backend_stack import BackendStack
from stacks.frontend_stack import FrontendStack


class AppStage(cdk.Stage):
    def __init__(self, scope: Construct, construct_id: str, env_name: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        BackendStack(self, "BackendStack", env_name=env_name)
        FrontendStack(self, "FrontendStack", env_name=env_name)
