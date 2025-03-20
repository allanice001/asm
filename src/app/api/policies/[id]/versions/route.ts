import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, createAuditLog } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const policyId = params.id

		const versions = await prisma.policyVersion.findMany({
			where: { policyId },
			orderBy: { versionNumber: "desc" },
			include: {
				createdBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		})

		return NextResponse.json(versions)
	} catch (error) {
		console.error("Error fetching policy versions:", error)
		return NextResponse.json({ message: "Error fetching policy versions" }, { status: 500 })
	}
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser()

	if (!currentUser) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const policyId = params.id

		const { policyDocument } = await request.json()

		// Check if policy exists
		const policy = await prisma.policy.findUnique({
			where: { id: policyId },
		})

		if (!policy) {
			return NextResponse.json({ message: "Policy not found" }, { status: 404 })
		}

		if (policy.isAwsManaged) {
			return NextResponse.json({ message: "Cannot create versions for AWS managed policies" }, { status: 400 })
		}

		// Get the latest version number
		const latestVersion = await prisma.policyVersion.findFirst({
			where: { policyId },
			orderBy: { versionNumber: "desc" },
		})

		const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1

		// Create new version
		const version = await prisma.policyVersion.create({
			data: {
				policyId,
				versionNumber: newVersionNumber,
				policyDocument,
				createdById: currentUser.id,
				isActive: false, // New versions are not active by default
			},
		})

		// Create audit log
		await createAuditLog(currentUser.id, "create", "policy-version", version.id.toString(), {
			policyId,
			versionNumber: version.versionNumber,
		})

		return NextResponse.json(version, { status: 201 })
	} catch (error) {
		console.error("Error creating policy version:", error)
		return NextResponse.json({ message: "Error creating policy version" }, { status: 500 })
	}
}

