import aws_cdk as cdk
from constructs import Construct
from aws_cdk import (
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
)


class FrontendStack(cdk.Stack):
    def __init__(self, scope: Construct, construct_id: str, env_name: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # ---- S3 Bucket (private, static hosting) ----
        site_bucket = s3.Bucket(
            self, "SiteBucket",
            bucket_name=f"{env_name}-st-frontend-{self.account}",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # ---- CloudFront OAI ----
        oai = cloudfront.OriginAccessIdentity(self, "OAI")
        site_bucket.grant_read(oai)

        # ---- Security Headers ----
        response_headers_policy = cloudfront.ResponseHeadersPolicy(
            self, "SecurityHeaders",
            response_headers_policy_name=f"{env_name}-st-security-headers",
            security_headers_behavior=cloudfront.ResponseSecurityHeadersBehavior(
                strict_transport_security=cloudfront.ResponseHeadersStrictTransportSecurity(
                    access_control_max_age=cdk.Duration.seconds(63072000),
                    include_subdomains=True,
                    override=True,
                ),
                content_type_options=cloudfront.ResponseHeadersContentTypeOptions(override=True),
                frame_options=cloudfront.ResponseHeadersFrameOptions(
                    frame_option=cloudfront.HeadersFrameOption.DENY,
                    override=True,
                ),
                referrer_policy=cloudfront.ResponseHeadersReferrerPolicy(
                    referrer_policy=cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                    override=True,
                ),
                content_security_policy=cloudfront.ResponseHeadersContentSecurityPolicy(
                    content_security_policy=(
                        "default-src 'self'; "
                        "script-src 'self' 'unsafe-eval' 'unsafe-inline'; "
                        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                        "font-src 'self' https://fonts.gstatic.com; "
                        "img-src 'self' data:; "
                        "connect-src 'self' https://*.amazonaws.com https://*.amazoncognito.com https://api.openai.com wss://api.openai.com; "
                        "media-src 'self' blob:; "
                        "worker-src 'self' blob:;"
                    ),
                    override=True,
                ),
            ),
        )

        # ---- CloudFront Function: rewrite /path/ → /path/index.html ----
        url_rewrite_fn = cloudfront.Function(
            self, "UrlRewriteFunction",
            function_name=f"{env_name}-st-url-rewrite",
            code=cloudfront.FunctionCode.from_inline(
                "function handler(event) {\n"
                "  var request = event.request;\n"
                "  var uri = request.uri;\n"
                "  if (uri.endsWith('/')) {\n"
                "    request.uri += 'index.html';\n"
                "  } else if (!uri.includes('.')) {\n"
                "    request.uri += '/index.html';\n"
                "  }\n"
                "  return request;\n"
                "}\n"
            ),
        )

        # ---- CloudFront Distribution ----
        distribution = cloudfront.Distribution(
            self, "Distribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_identity(site_bucket, origin_access_identity=oai),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                response_headers_policy=response_headers_policy,
                cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                function_associations=[
                    cloudfront.FunctionAssociation(
                        function=url_rewrite_fn,
                        event_type=cloudfront.FunctionEventType.VIEWER_REQUEST,
                    ),
                ],
            ),
            additional_behaviors={
                "/_next/static/*": cloudfront.BehaviorOptions(
                    origin=origins.S3BucketOrigin.with_origin_access_identity(site_bucket, origin_access_identity=oai),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                ),
            },
            default_root_object="index.html",
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=cdk.Duration.seconds(0),
                ),
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=cdk.Duration.seconds(0),
                ),
            ],
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
        )

        # Expose bucket and distribution for pipeline deploy step
        self.site_bucket = site_bucket
        self.distribution = distribution

        # ---- Outputs ----
        cdk.CfnOutput(
            self, "BucketName",
            value=site_bucket.bucket_name,
            export_name=f"{env_name}-st-bucket-name",
        )
        cdk.CfnOutput(
            self, "CloudFrontUrl",
            value=f"https://{distribution.distribution_domain_name}",
            export_name=f"{env_name}-st-cloudfront-url",
        )
        cdk.CfnOutput(
            self, "DistributionId",
            value=distribution.distribution_id,
            export_name=f"{env_name}-st-distribution-id",
        )
