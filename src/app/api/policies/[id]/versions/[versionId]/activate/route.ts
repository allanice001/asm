import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, createAuditLog } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string; versionId: string } }) {
	const currentUser = await getCurrentUser()

	if (!currentUser) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const policyId = params.id
		const versionId = params.versionId

		// Check if policy exists
		const policy = await prisma.policy.findUnique({
			where: { id: policyId },
		})

		if (!policy) {
			return NextResponse.json({ message: "Policy not found" }, { status: 404 })
		}

		// Check if version exists and belongs to the policy
		const version = await prisma.policyVersion.findUnique({
			where: { id: versionId },
		})

		if (!version || version.policyId !== policyId) {
			return NextResponse.json({ message: "Version not found or does not belong to this policy" }, { status: 404 })
		}

		// Deactivate all versions of this policy
		await prisma.policyVersion.updateMany({
			where: { policyId },
			data: { isActive: false },
		})

		// Activate the specified version
		await prisma.policyVersion.update({
			where: { id: versionId },
			data: { isActive: true },
		})

		// Update the policy document in the policy
		await prisma.policy.update({
			where: { id: policyId },
			data: {
				policyDocument: version.policyDocument,
				updatedAt: new Date(),
			},
		})

		// Create audit log
		await createAuditLog(currentUser.id, "activate", "policy-version", versionId.toString(), {
			policyId,
			versionNumber: version.versionNumber,
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Error activating policy version:", error)
		return NextResponse.json({ message: "Error activating policy version" }, { status: 500 })
	}
}

