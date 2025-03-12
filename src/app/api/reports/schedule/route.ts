import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Parse request body
		const body = await request.json()
		const { name, period, schedule, recipients } = body

		// Validate required fields
		if (!name || !period || !schedule) {
			return NextResponse.json({ error: "Name, period, and schedule are required" }, { status: 400 })
		}

		// Create scheduled report
		// Note: This is a simplified version. In a real implementation,
		// you would use a job scheduler or cron service to trigger reports
		const report = await prisma.deploymentReport.create({
			data: {
				name,
				period,
				startDate: new Date(),
				endDate: new Date(),
				data: JSON.stringify({ scheduled: true, recipients }),
				createdBy: session.user.email || "system",
				isScheduled: true,
			},
		})

		return NextResponse.json({
			message: "Report scheduled successfully",
			report,
		})
	} catch (error) {
		console.error("Error scheduling report:", error)
		return NextResponse.json({ error: "Failed to schedule report" }, { status: 500 })
	}
}

