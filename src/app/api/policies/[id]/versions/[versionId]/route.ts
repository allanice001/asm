import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string; versionId: string } }) {
	try {
		const policyId = params.id
		const versionId = params.versionId

		const version = await prisma.policyVersion.findUnique({
			where: { id: versionId },
			include: {
				policy: {
					select: {
						id: true,
						name: true,
					},
				},
				createdBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		})

		if (!version || version.policyId !== policyId) {
			return NextResponse.json({ message: "Policy version not found" }, { status: 404 })
		}

		return NextResponse.json(version)
	} catch (error) {
		console.error("Error fetching policy version:", error)
		return NextResponse.json({ message: "Error fetching policy version" }, { status: 500 })
	}
}

