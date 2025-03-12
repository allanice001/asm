// This is a template for an AWS Lambda function that can be deployed
// to enforce compliance across the organization
import type { SQSEvent, SQSHandler, SNSEvent, SNSHandler } from "aws-lambda"
import { IAMClient, GetRoleCommand, CreateRoleCommand, AttachRolePolicyCommand } from "@aws-sdk/client-iam"
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts"
import { OrganizationsClient, ListAccountsCommand } from "@aws-sdk/client-organizations"

// Handler for SQS events (for batch processing)
export const sqsHandler: SQSHandler = async (event: SQSEvent) => {
	console.log("Processing SQS event with", event.Records.length, "records")

	for (const record of event.Records) {
		try {
			const message = JSON.parse(record.body)
			await processComplianceMessage(message)
		} catch (error) {
			console.error("Error processing SQS record:", error)
		}
	}
}

// Handler for SNS events (for real-time notifications)
export const snsHandler: SNSHandler = async (event: SNSEvent) => {
	console.log("Processing SNS event with", event.Records.length, "records")

	for (const record of event.Records) {
		try {
			const message = JSON.parse(record.Sns.Message)
			await processComplianceMessage(message)
		} catch (error) {
			console.error("Error processing SNS record:", error)
		}
	}
}

// Process a compliance enforcement message
async function processComplianceMessage(message: any) {
	console.log("Processing compliance message:", message)

	// Example: react to a failed deployment
	if (message.status === "FAILED") {
		await handleFailedDeployment(message)
	}

	// Example: ensure all accounts have required roles
	if (message.type === "COMPLIANCE_CHECK") {
		await ensureRequiredRolesExist(message.mandatoryRoles || [])
	}
}

// Example handler for failed deployments
async function handleFailedDeployment(message: any) {
	console.log("Handling failed deployment:", message.deploymentId)

	// You could implement retry logic, notifications, or other remediation
	// This is just a placeholder example

	// Create clients
	const stsClient = new STSClient({})

	// Retry logic could go here
}

// Example: Ensure all accounts have required roles
async function ensureRequiredRolesExist(mandatoryRoles: string[]) {
	console.log("Ensuring all accounts have mandatory roles:", mandatoryRoles)

	const orgClient = new OrganizationsClient({})
	const stsClient = new STSClient({})

	try {
		// Get all accounts in the organization
		const accountsResponse = await orgClient.send(new ListAccountsCommand({}))
		const accounts = accountsResponse.Accounts || []

		console.log(`Found ${accounts.length} accounts to check for compliance`)

		// For each account and each mandatory role, ensure it exists
		for (const account of accounts) {
			if (account.Status !== "ACTIVE" || !account.Id) continue

			try {
				// Assume role in the account
				const assumeRoleResponse = await stsClient.send(
					new AssumeRoleCommand({
						RoleArn: `arn:aws:iam::${account.Id}:role/OrganizationAccountAccessRole`,
						RoleSessionName: "ComplianceEnforcement",
					}),
				)

				const credentials = assumeRoleResponse.Credentials
				if (!credentials) continue

				// Create IAM client for this account
				const iamClient = new IAMClient({
					credentials: {
						accessKeyId: credentials.AccessKeyId!,
						secretAccessKey: credentials.SecretAccessKey!,
						sessionToken: credentials.SessionToken,
					},
				})

				// Check and create each mandatory role if missing
				for (const roleName of mandatoryRoles) {
					try {
						// Check if role exists
						await iamClient.send(new GetRoleCommand({ RoleName: roleName }))
						console.log(`Role ${roleName} already exists in account ${account.Id}`)
					} catch (error) {
						if (error.name === "NoSuchEntityException") {
							console.log(`Creating missing mandatory role ${roleName} in account ${account.Id}`)

							// Create the role
							await iamClient.send(
								new CreateRoleCommand({
									RoleName: roleName,
									AssumeRolePolicyDocument: JSON.stringify({
										Version: "2012-10-17",
										Statement: [
											{
												Effect: "Allow",
												Principal: {
													Service: "ec2.amazonaws.com",
												},
												Action: "sts:AssumeRole",
											},
										],
									}),
									Description: "Mandatory role enforced by compliance",
								}),
							)

							// Attach policies as needed
							// This is just an example
							await iamClient.send(
								new AttachRolePolicyCommand({
									RoleName: roleName,
									PolicyArn: "arn:aws:iam::aws:policy/ReadOnlyAccess",
								}),
							)
						} else {
							console.error(`Error checking role ${roleName} in account ${account.Id}:`, error)
						}
					}
				}
			} catch (error) {
				console.error(`Failed to process account ${account.Id}:`, error)
			}
		}
	} catch (error) {
		console.error("Error enforcing compliance across accounts:", error)
		throw error
	}
}

// Utility function to implement exponential backoff
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
				error.name === "ThrottlingException" || error.name === "Throttling" || error.code === "TooManyRequestsException"

			if (attempt >= retries || !isThrottlingError) {
				throw error
			}

			// Calculate exponential backoff with jitter
			const jitter = Math.random() * 0.3 + 0.85 // 0.85-1.15 to add 15% jitter
			delay = Math.min(delay * 2 * jitter, maxDelay)

			console.log(`API throttling detected. Retry ${attempt}/${retries} after ${delay}ms delay`)
			await new Promise((resolve) => setTimeout(resolve, delay))
		}
	}
}

