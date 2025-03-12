import { PrismaClient } from "@prisma/client"
import {
	IAMClient,
	CreateRoleCommand,
	AttachRolePolicyCommand,
	DeleteRoleCommand,
	DetachRolePolicyCommand,
	ListAttachedRolePoliciesCommand,
	GetRoleCommand,
} from "@aws-sdk/client-iam"
import {
	SSOAdminClient,
	CreatePermissionSetCommand,
	ProvisionPermissionSetCommand,
	AttachManagedPolicyToPermissionSetCommand,
	PutInlinePolicyToPermissionSetCommand,
} from "@aws-sdk/client-sso-admin"
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts"
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns"

const prisma = new PrismaClient()

// Deployment queue to ensure sequential processing
class DeploymentQueue {
	private static instance: DeploymentQueue
	private queue: any[] = []
	private processing = false
	private snsClient: SNSClient | null = null
	private topicArn: string | null = null

	private constructor() {
		// Initialize SNS client if environment variables are set
		if (process.env.AWS_REGION && process.env.DEPLOYMENT_TOPIC_ARN) {
			this.snsClient = new SNSClient({ region: process.env.AWS_REGION })
			this.topicArn = process.env.DEPLOYMENT_TOPIC_ARN
		}
	}

	public static getInstance(): DeploymentQueue {
		if (!DeploymentQueue.instance) {
			DeploymentQueue.instance = new DeploymentQueue()
		}
		return DeploymentQueue.instance
	}

	public async enqueue(deploymentId: string): Promise<void> {
		// Add to the queue
		this.queue.push(deploymentId)
		console.log(`Deployment ${deploymentId} added to queue. Queue length: ${this.queue.length}`)

		// Start processing if not already active
		if (!this.processing) {
			this.processNext()
		}
	}

	public async publishToSNS(deploymentId: string, status: string): Promise<void> {
		// Skip if SNS not configured
		if (!this.snsClient || !this.topicArn) {
			console.log("SNS not configured, skipping pub/sub notification")
			return
		}

		try {
			// Get deployment details
			const deployment = await prisma.deployment.findUnique({
				where: { id: deploymentId },
				include: {
					account: true,
					role: true,
					permissionSet: true,
				},
			})

			if (!deployment) {
				console.error(`Deployment ${deploymentId} not found for SNS publishing`)
				return
			}

			// Publish to SNS
			const message = {
				deploymentId,
				status,
				type: deployment.type,
				accountId: deployment.account?.accountId,
				roleId: deployment.role?.id,
				roleName: deployment.role?.name,
				permissionSetId: deployment.permissionSet?.id,
				permissionSetName: deployment.permissionSet?.name,
				timestamp: new Date().toISOString(),
			}

			await this.snsClient.send(
				new PublishCommand({
					TopicArn: this.topicArn,
					Message: JSON.stringify(message),
					MessageAttributes: {
						deploymentType: {
							DataType: "String",
							StringValue: deployment.type,
						},
						status: {
							DataType: "String",
							StringValue: status,
						},
						accountId: {
							DataType: "String",
							StringValue: deployment.account?.accountId || "unknown",
						},
					},
				}),
			)
			console.log(`Published deployment ${deploymentId} status to SNS`)
		} catch (error) {
			console.error("Error publishing to SNS:", error)
		}
	}

	private async processNext(): Promise<void> {
		if (this.queue.length === 0) {
			this.processing = false
			return
		}

		this.processing = true
		const deploymentId = this.queue.shift()
		console.log(`Processing deployment ${deploymentId}. Remaining queue: ${this.queue.length}`)

		try {
			// Update status to IN_PROGRESS
			await prisma.deployment.update({
				where: { id: deploymentId },
				data: { status: "IN_PROGRESS" },
			})

			// Publish "IN_PROGRESS" status to SNS
			await this.publishToSNS(deploymentId, "IN_PROGRESS")

			// Get deployment details
			const deployment = await prisma.deployment.findUnique({
				where: { id: deploymentId },
				include: {
					account: true,
					role: true,
					permissionSet: true,
				},
			})

			if (!deployment) {
				throw new Error(`Deployment ${deploymentId} not found`)
			}

			// Get AWS settings
			const awsSettings = await prisma.awsSettings.findFirst()
			if (!awsSettings) {
				throw new Error("AWS settings not configured")
			}

			// Process based on deployment type
			if (deployment.type === "ROLE") {
				await processRoleDeployment(deployment, deployment.account, awsSettings, deployment.createdBy)
			} else if (deployment.type === "PERMISSION_SET") {
				await processPermissionSetDeployment(deployment, deployment.account, awsSettings, deployment.createdBy)
			}

			// Update status to COMPLETED
			await prisma.deployment.update({
				where: { id: deploymentId },
				data: {
					status: "COMPLETED",
					completedAt: new Date(),
				},
			})

			// Publish "COMPLETED" status to SNS
			await this.publishToSNS(deploymentId, "COMPLETED")

			console.log(`Deployment ${deploymentId} completed successfully`)
		} catch (error) {
			console.error(`Error processing deployment ${deploymentId}:`, error)

			// Update status to FAILED
			await prisma.deployment.update({
				where: { id: deploymentId },
				data: {
					status: "FAILED",
					completedAt: new Date(),
				},
			})

			// Log error
			await prisma.deploymentLog.create({
				data: {
					deploymentId,
					message: `Deployment failed: ${error.message || "Unknown error"}`,
					details: JSON.stringify({ error: error.message, stack: error.stack }),
					level: "ERROR",
				},
			})

			// Publish "FAILED" status to SNS
			await this.publishToSNS(deploymentId, "FAILED")
		} finally {
			// Process next deployment with a delay to avoid throttling
			setTimeout(() => this.processNext(), 2000)
		}
	}
}

// Retry function with exponential backoff
async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	retries = 5,
	initialDelay = 1000,
	maxDelay = 30000,
): Promise<T> {
	let attempt = 0
	let delay = initialDelay

	while (true) {
		try {
			return await fn()
		} catch (error) {
			attempt++

			// If max retries reached or not a throttling error, rethrow
			const isThrottlingError =
				error.name === "ThrottlingException" ||
				error.name === "Throttling" ||
				error.code === "TooManyRequestsException" ||
				error.message?.includes("Rate exceeded")

			if (attempt >= retries || !isThrottlingError) {
				throw error
			}

			// Calculate exponential backoff with jitter
			const jitter = Math.random() * 0.3 + 0.85 // 0.85-1.15 to add 15% jitter
			delay = Math.min(delay * 2 * jitter, maxDelay)

			console.log(`AWS API throttling detected. Retry ${attempt}/${retries} after ${delay}ms delay`)
			await new Promise((resolve) => setTimeout(resolve, delay))
		}
	}
}

// Process role deployments with throttling protection
async function processRoleDeployment(deployment: any, account: any, awsSettings: any, userEmail: string) {
	try {
		// Get role details
		const role = await prisma.role.findUnique({
			where: { id: deployment.roleId },
			include: {
				policies: true,
			},
		})

		if (!role) {
			throw new Error(`Role not found for deployment ${deployment.id}`)
		}

		// Create STS client
		const stsClient = new STSClient({
			region: awsSettings.region,
			credentials: {
				accessKeyId: awsSettings.accessKeyId,
				secretAccessKey: awsSettings.secretAccessKey,
			},
		})

		// Assume role with retry
		const assumeRoleResponse = await retryWithBackoff(() =>
			stsClient.send(
				new AssumeRoleCommand({
					RoleArn: `arn:aws:iam::${account.accountId}:role/${awsSettings.crossAccountRoleName}`,
					RoleSessionName: `RoleDeployment-${deployment.id}`,
				}),
			),
		)

		if (!assumeRoleResponse.Credentials) {
			throw new Error(`Failed to assume role in account ${account.accountId}`)
		}

		// Create IAM client with temporary credentials
		const iamClient = new IAMClient({
			region: awsSettings.region,
			credentials: {
				accessKeyId: assumeRoleResponse.Credentials.AccessKeyId!,
				secretAccessKey: assumeRoleResponse.Credentials.SecretAccessKey!,
				sessionToken: assumeRoleResponse.Credentials.SessionToken,
			},
		})

		// Process based on action
		if (deployment.action === "CREATE" || deployment.action === "UPDATE") {
			// Check if role exists for UPDATE
			if (deployment.action === "UPDATE") {
				try {
					await retryWithBackoff(() => iamClient.send(new GetRoleCommand({ RoleName: role.name })))
				} catch (error) {
					// If role doesn't exist, create it
					deployment.action = "CREATE"
				}
			}

			// Create role if it doesn't exist
			if (deployment.action === "CREATE") {
				await retryWithBackoff(() =>
					iamClient.send(
						new CreateRoleCommand({
							RoleName: role.name,
							AssumeRolePolicyDocument: role.trustPolicy,
							Description: role.description || undefined,
							MaxSessionDuration: role.maxSessionDuration || 3600,
							Tags: [
								{
									Key: "ManagedBy",
									Value: "AWS-SSO-Manager",
								},
								{
									Key: "CreatedBy",
									Value: userEmail,
								},
							],
						}),
					),
				)
			}

			// Attach policies with retries
			for (const policy of role.policies) {
				await retryWithBackoff(() =>
					iamClient.send(
						new AttachRolePolicyCommand({
							RoleName: role.name,
							PolicyArn: policy.arn,
						}),
					),
				)
			}
		} else if (deployment.action === "DELETE") {
			try {
				// List attached policies
				const policiesResponse = await retryWithBackoff(() =>
					iamClient.send(
						new ListAttachedRolePoliciesCommand({
							RoleName: role.name,
						}),
					),
				)

				// Detach all policies
				for (const policy of policiesResponse.AttachedPolicies || []) {
					await retryWithBackoff(() =>
						iamClient.send(
							new DetachRolePolicyCommand({
								RoleName: role.name,
								PolicyArn: policy.PolicyArn,
							}),
						),
					)
				}

				// Delete role
				await retryWithBackoff(() =>
					iamClient.send(
						new DeleteRoleCommand({
							RoleName: role.name,
						}),
					),
				)
			} catch (error) {
				// Role might not exist, which is fine for DELETE
				console.log(`Role ${role.name} might not exist in account ${account.accountId}`)
			}
		}

		// Log deployment details
		await prisma.deploymentLog.create({
			data: {
				deploymentId: deployment.id,
				message: `Successfully ${deployment.action.toLowerCase()}d role ${role.name} in account ${account.accountId}`,
				details: JSON.stringify({
					role: role.name,
					account: account.accountId,
					action: deployment.action,
				}),
				level: "INFO",
			},
		})
	} catch (error) {
		// Log error
		await prisma.deploymentLog.create({
			data: {
				deploymentId: deployment.id,
				message: `Failed to ${deployment.action.toLowerCase()} role in account ${account.accountId}: ${error.message}`,
				details: JSON.stringify({
					error: error.message,
					stack: error.stack,
					account: account.accountId,
					action: deployment.action,
				}),
				level: "ERROR",
			},
		})

		throw error
	}
}

// Process permission set deployments with throttling protection
async function processPermissionSetDeployment(deployment: any, account: any, awsSettings: any, userEmail: string) {
	try {
		// Get permission set details
		const permissionSet = await prisma.permissionSet.findUnique({
			where: { id: deployment.permissionSetId },
			include: {
				policies: true,
			},
		})

		if (!permissionSet) {
			throw new Error(`Permission Set not found for deployment ${deployment.id}`)
		}

		// Create SSO Admin client
		const ssoAdminClient = new SSOAdminClient({
			region: awsSettings.region,
			credentials: {
				accessKeyId: awsSettings.accessKeyId,
				secretAccessKey: awsSettings.secretAccessKey,
			},
		})

		// Process based on action
		if (deployment.action === "CREATE") {
			// Create permission set with retry
			const createResponse = await retryWithBackoff(() =>
				ssoAdminClient.send(
					new CreatePermissionSetCommand({
						Name: permissionSet.name,
						Description: permissionSet.description || undefined,
						InstanceArn: awsSettings.ssoInstanceArn,
						SessionDuration: permissionSet.sessionDuration || "PT1H",
						Tags: [
							{
								Key: "ManagedBy",
								Value: "AWS-SSO-Manager",
							},
							{
								Key: "CreatedBy",
								Value: userEmail,
							},
						],
					}),
				),
			)

			const permissionSetArn = createResponse.PermissionSet?.PermissionSetArn

			if (!permissionSetArn) {
				throw new Error(`Failed to create permission set ${permissionSet.name}`)
			}

			// Attach managed policies with retries
			for (const policy of permissionSet.policies) {
				await retryWithBackoff(() =>
					ssoAdminClient.send(
						new AttachManagedPolicyToPermissionSetCommand({
							InstanceArn: awsSettings.ssoInstanceArn,
							PermissionSetArn: permissionSetArn,
							ManagedPolicyArn: policy.arn,
						}),
					),
				)
			}

			// Add inline policy if exists
			if (permissionSet.inlinePolicy) {
				await retryWithBackoff(() =>
					ssoAdminClient.send(
						new PutInlinePolicyToPermissionSetCommand({
							InstanceArn: awsSettings.ssoInstanceArn,
							PermissionSetArn: permissionSetArn,
							InlinePolicy: permissionSet.inlinePolicy,
						}),
					),
				)
			}

			// Provision permission set to account
			await retryWithBackoff(() =>
				ssoAdminClient.send(
					new ProvisionPermissionSetCommand({
						InstanceArn: awsSettings.ssoInstanceArn,
						PermissionSetArn: permissionSetArn,
						TargetId: account.accountId,
						TargetType: "AWS_ACCOUNT",
					}),
				),
			)
		} else if (deployment.action === "DELETE") {
			// This is a simplified version for demo purposes
			await prisma.deploymentLog.create({
				data: {
					deploymentId: deployment.id,
					message: `Would delete permission set ${permissionSet.name} from account ${account.accountId}`,
					details: JSON.stringify({
						permissionSet: permissionSet.name,
						account: account.accountId,
						action: deployment.action,
					}),
					level: "INFO",
				},
			})
		}

		// Log deployment details
		await prisma.deploymentLog.create({
			data: {
				deploymentId: deployment.id,
				message: `Successfully ${deployment.action.toLowerCase()}d permission set ${permissionSet.name} in account ${account.accountId}`,
				details: JSON.stringify({
					permissionSet: permissionSet.name,
					account: account.accountId,
					action: deployment.action,
				}),
				level: "INFO",
			},
		})
	} catch (error) {
		// Log error
		await prisma.deploymentLog.create({
			data: {
				deploymentId: deployment.id,
				message: `Failed to ${deployment.action.toLowerCase()} permission set in account ${account.accountId}: ${error.message}`,
				details: JSON.stringify({
					error: error.message,
					stack: error.stack,
					account: account.accountId,
					action: deployment.action,
				}),
				level: "ERROR",
			},
		})

		throw error
	}
}

// Export a function to enqueue a deployment
export async function enqueueDeployment(deploymentId: string): Promise<void> {
	return DeploymentQueue.getInstance().enqueue(deploymentId)
}

// Export the queue for use in API routes
export const deploymentQueue = DeploymentQueue.getInstance()

