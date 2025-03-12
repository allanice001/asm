import {NextResponse} from "next/server"
import {getServerSession} from "next-auth"
import {authOptions} from "@/lib/auth"
import {prisma} from "@/lib/prisma"

export async function GET() {
	try {
		// Check authentication
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Get queue status from deployments table
		const pendingDeployments = await prisma.deployment.count({
			where: { status: "PENDING" },
		})

		const inProgressDeployments = await prisma.deployment.count({
			where: { status: "IN_PROGRESS" },
		})

		const totalDeployments = await prisma.deployment.count({
			where: {
				status: { in: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"] },
				createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
			},
		})

		// Calculate average completion time based on recent deployments
		const recentCompletedDeployments = await prisma.deployment.findMany({
			where: {
				status: "COMPLETED",
				createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
				completedAt: { not: null },
			},
			select: {
				createdAt: true,
				completedAt: true,
			},
		})

		// Calculate average deployment time in minutes
		let avgDeploymentTime = 5 // default 5 minutes if no data

		if (recentCompletedDeployments.length > 0) {
			const deploymentTimes = recentCompletedDeployments.map((d) => {
				const createdAt = new Date(d.createdAt).getTime()
				const completedAt = new Date(d.completedAt!).getTime()
				return (completedAt - createdAt) / (60 * 1000) // minutes
			})

			avgDeploymentTime = deploymentTimes.reduce((sum, time) => sum + time, 0) / deploymentTimes.length
		}

		// Calculate estimated time to completion
		const estimatedTimeToCompletion = (pendingDeployments * avgDeploymentTime) / Math.max(1, inProgressDeployments)

		return NextResponse.json({
			status: {
				queuedDeployments: pendingDeployments,
				inProgressDeployments: inProgressDeployments,
				totalDeployments: totalDeployments,
				avgDeploymentTime: avgDeploymentTime,
				estimatedTimeToCompletion: estimatedTimeToCompletion,
			},
		})
	} catch (error) {
		console.error("Error fetching queue status:", error)
		return NextResponse.json({ error: "Failed to fetch queue status" }, { status: 500 })
	}
}

