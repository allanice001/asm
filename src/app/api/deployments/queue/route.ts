import {NextResponse} from "next/server"
import {getServerSession} from "next-auth"
import {authOptions} from "@/lib/auth"

export async function GET() {
	try {
		// Check authentication
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Since we're doing direct deployments, return simplified queue status
		return NextResponse.json({
			status: {
				queuedDeployments: 0,
				inProgressDeployments: 0,
				totalDeployments: 0,
				avgDeploymentTime: 0,
				estimatedTimeToCompletion: 0,
			},
			message: "Direct deployments enabled - no queue in use",
		})
	} catch (error) {
		console.error("Error fetching queue status:", error)
		return NextResponse.json({
			status: {
				queuedDeployments: 0,
				inProgressDeployments: 0,
				totalDeployments: 0,
				avgDeploymentTime: 0,
				estimatedTimeToCompletion: 0,
			},
		})
	}
}

