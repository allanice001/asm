// This is a template for deploying the compliance enforcement Lambda using AWS CDK
import * as cdk from "aws-cdk-lib"
import type { Construct } from "constructs"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as iam from "aws-cdk-lib/aws-iam"
import * as sns from "aws-cdk-lib/aws-sns"
import * as sqs from "aws-cdk-lib/aws-sqs"
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions"
import * as events from "aws-cdk-lib/aws-events"
import * as targets from "aws-cdk-lib/aws-events-targets"

export class AwsSsoComplianceStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props)

		// Create SNS topic for deployment notifications
		const deploymentTopic = new sns.Topic(this, "DeploymentTopic", {
			displayName: "AWS SSO Role Deployment Notifications",
		})

		// Create SQS queue for batch processing of deployments
		const deploymentQueue = new sqs.Queue(this, "DeploymentQueue", {
			visibilityTimeout: cdk.Duration.seconds(300),
			retentionPeriod: cdk.Duration.days(7),
		})

		// Subscribe the queue to the SNS topic
		deploymentTopic.addSubscription(
			new subscriptions.SqsSubscription(deploymentQueue, {
				filterPolicy: {
					status: sns.SubscriptionFilter.stringFilter({
						allowlist: ["FAILED", "COMPLETED"],
					}),
				},
			}),
		)

		// Create IAM role for the Lambda function
		const lambdaRole = new iam.Role(this, "ComplianceLambdaRole", {
			assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
			managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
		})

		// Add required permissions for the Lambda
		lambdaRole.addToPolicy(
			new iam.PolicyStatement({
				actions: ["organizations:ListAccounts", "organizations:DescribeAccount", "sts:AssumeRole"],
				resources: ["*"],
			}),
		)

		// Create Lambda function for processing SNS messages directly
		const snsProcessor = new lambda.Function(this, "SNSProcessor", {
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: "index.snsHandler",
			code: lambda.Code.fromAsset("lambda/compliance-lambda"),
			timeout: cdk.Duration.seconds(30),
			role: lambdaRole,
			environment: {
				CROSS_ACCOUNT_ROLE_NAME: "OrganizationAccountAccessRole",
			},
		})

		// Create Lambda function for processing SQS messages in batch
		const sqsProcessor = new lambda.Function(this, "SQSProcessor", {
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: "index.sqsHandler",
			code: lambda.Code.fromAsset("lambda/compliance-lambda"),
			timeout: cdk.Duration.seconds(60),
			role: lambdaRole,
			environment: {
				CROSS_ACCOUNT_ROLE_NAME: "OrganizationAccountAccessRole",
			},
		})

		// Add SQS as event source for the Lambda
		sqsProcessor.addEventSource(
			new lambda.SqsEventSource(deploymentQueue, {
				batchSize: 10,
			}),
		)

		// Subscribe the SNS Lambda to the topic directly for real-time processing
		deploymentTopic.addSubscription(new subscriptions.LambdaSubscription(snsProcessor))

		// Create a scheduled compliance check
		const rule = new events.Rule(this, "ComplianceCheckRule", {
			schedule: events.Schedule.rate(cdk.Duration.hours(6)),
		})

		// Target the SNS processor Lambda with compliance check event pattern
		rule.addTarget(
			new targets.LambdaFunction(snsProcessor, {
				event: events.RuleTargetInput.fromObject({
					type: "COMPLIANCE_CHECK",
					mandatoryRoles: ["MandatorySecurityRole", "MandatoryAuditRole"],
					timestamp: events.EventField.time,
				}),
			}),
		)

		// Outputs
		new cdk.CfnOutput(this, "DeploymentTopicArn", {
			value: deploymentTopic.topicArn,
			description: "The ARN of the SNS topic for deployment notifications",
			exportName: "DeploymentTopicArn",
		})

		new cdk.CfnOutput(this, "DeploymentQueueUrl", {
			value: deploymentQueue.queueUrl,
			description: "The URL of the SQS queue for batch deployment processing",
			exportName: "DeploymentQueueUrl",
		})
	}
}

