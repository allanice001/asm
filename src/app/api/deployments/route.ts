import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export async function GET() {
	try {
		const deployments = await prisma.deployment.findMany({
			orderBy: {
				startedAt: "desc",
			},
			include: {
				user: true,
				account: true,
			},
		})

		return NextResponse.json(deployments)
	} catch (error) {
		console.error("Error fetching deployments:", error)
		return NextResponse.json({ message: "Error fetching deployments" }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	const session = await getServerSession()

	if (!session || !session.user || !session.user.email) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const { accountId, deployPermissionSets, deployPolicies } = await request.json()

		// Validate account exists
		const account = await prisma.awsAccount.findUnique({
			where: { id: accountId },
		})

		if (!account) {
			return NextResponse.json({ message: "Account not found" }, { status: 404 })
		}

		const user = await prisma.user.findUnique({
			where: {
				email: session.user.email
			}
		})
		// Create deployment record
		const deployment = await prisma.deployment.create({
			data: {
				status: "in_progress",
				logOutput: "Deployment started...\n",
				user: {
					connect: { id: user?.id },
				},
				account: {
					connect: { id: accountId },
				},
			},
		})

		// Start deployment process asynchronously
		// In a real application, this would be a background job
		setTimeout(async () => {
			try {
				let logOutput = "Deployment started...\n"

				// Simulate AWS SSO deployment
				if (deployPermissionSets) {
					logOutput += "Deploying permission sets...\n"

					// Get permission sets assigned to this account
					const accountPermissionSets = await prisma.accountPermissionSet.findMany({
						where: { accountId },
						include: {
							permissionSet: {
								include: {
									policies: {
										include: {
											policy: true,
										},
									},
								},
							},
						},
					})

					for (const item of accountPermissionSets) {
						logOutput += `Processing permission set: ${item.permissionSet.name}...\n`

						// In a real implementation, this would call AWS SSO APIs
						// For now, we'll just simulate the deployment
						await new Promise((resolve) => setTimeout(resolve, 1000))

						logOutput += `Permission set ${item.permissionSet.name} deployed successfully.\n`
					}
				}

				if (deployPolicies) {
					logOutput += "Deploying account-specific policies...\n"

					// Get account-specific policies for this account
					const accountPolicies = await prisma.accountSpecificPolicy.findMany({
						where: { accountId },
						include: {
							policy: true,
						},
					})

					for (const item of accountPolicies) {
						logOutput += `Processing policy: ${item.policy.name}...\n`

						// In a real implementation, this would call AWS APIs
						// For now, we'll just simulate the deployment
						await new Promise((resolve) => setTimeout(resolve, 1000))

						logOutput += `Policy ${item.policy.name} deployed successfully.\n`
					}
				}

				// Update deployment record
				await prisma.deployment.update({
					where: { id: deployment.id },
					data: {
						status: "completed",
						completedAt: new Date(),
						logOutput,
					},
				})
			} catch (error) {
				console.error("Error during deployment:", error)

				// Update deployment record with error
				await prisma.deployment.update({
					where: { id: deployment.id },
					data: {
						status: "failed",
						completedAt: new Date(),
						logOutput: `Deployment failed: ${error instanceof Error ? error.message : String(error)}`,
					},
				})
			}
		}, 0)

		return NextResponse.json(deployment, { status: 201 })
	} catch (error) {
		console.error("Error creating deployment:", error)
		return NextResponse.json({ message: "Error creating deployment" }, { status: 500 })
	}
}

