import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const policyId = params.id

		const policy = await prisma.policy.findUnique({
			where: { id: policyId },
		})

		if (!policy) {
			return NextResponse.json({ message: "Policy not found" }, { status: 404 })
		}

		return NextResponse.json(policy)
	} catch (error) {
		console.error("Error fetching policy:", error)
		return NextResponse.json({ message: "Error fetching policy" }, { status: 500 })
	}
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
	const session = await getServerSession()

	if (!session) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const policyId = params.id
		const data = await request.json()

		// Check if policy exists
		const existingPolicy = await prisma.policy.findUnique({
			where: { id: policyId },
		})

		if (!existingPolicy) {
			return NextResponse.json({ message: "Policy not found" }, { status: 404 })
		}

		// Update policy
		const updatedPolicy = await prisma.policy.update({
			where: { id: policyId },
			data: {
				name: data.name,
				description: data.description || null,
				policyDocument: data.policyDocument || existingPolicy.policyDocument,
				isAwsManaged: data.isAwsManaged !== undefined ? data.isAwsManaged : existingPolicy.isAwsManaged,
				policyArn: data.policyArn || null,
				isAccountSpecific:
					data.isAccountSpecific !== undefined ? data.isAccountSpecific : existingPolicy.isAccountSpecific,
				updatedAt: new Date(),
			},
		})

		return NextResponse.json(updatedPolicy)
	} catch (error) {
		console.error("Error updating policy:", error)
		return NextResponse.json({ message: "Error updating policy" }, { status: 500 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	const session = await getServerSession()

	if (!session) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const policyId = params.id

		// Check if policy exists
		const existingPolicy = await prisma.policy.findUnique({
			where: { id: policyId },
		})

		if (!existingPolicy) {
			return NextResponse.json({ message: "Policy not found" }, { status: 404 })
		}

		// Delete policy
		await prisma.policy.delete({
			where: { id: policyId },
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Error deleting policy:", error)
		return NextResponse.json({ message: "Error deleting policy" }, { status: 500 })
	}
}

