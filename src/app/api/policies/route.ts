import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, createAuditLog } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Check if we need to filter by isAccountSpecific
    const { searchParams } = new URL(request.url)
    const isAccountSpecific = searchParams.get("isAccountSpecific") === "true"

    const policies = await prisma.policy.findMany({
      where: isAccountSpecific ? { isAccountSpecific: true } : undefined,
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(policies)
  } catch (error) {
    console.error("Error fetching policies:", error)
    return NextResponse.json({ message: "Error fetching policies" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await request.json()

    // Validate policy document
    if (!data.isAwsManaged && !data.policyDocument) {
      return NextResponse.json({ message: "Policy document is required for custom policies" }, { status: 400 })
    }

    // Validate AWS managed policy ARN
    if (data.isAwsManaged && !data.policyArn) {
      return NextResponse.json({ message: "Policy ARN is required for AWS managed policies" }, { status: 400 })
    }

    // Create the policy
    const policy = await prisma.policy.create({
      data: {
        name: data.name,
        description: data.description || null,
        policyDocument: data.policyDocument || {},
        isAwsManaged: data.isAwsManaged || false,
        policyArn: data.policyArn || null,
        isAccountSpecific: data.isAccountSpecific || false,
      },
    })

    // Create the initial policy version
    if (!data.isAwsManaged) {
      await prisma.policyVersion.create({
        data: {
          policyId: policy.id,
          versionNumber: 1,
          policyDocument: data.policyDocument,
          createdById: currentUser.id,
          isActive: true,
        },
      })
    }

    // Create audit log
    await createAuditLog(currentUser.id, "create", "policy", policy.id.toString(), {
      name: policy.name,
      isAwsManaged: policy.isAwsManaged,
      isAccountSpecific: policy.isAccountSpecific,
    })

    return NextResponse.json(policy, { status: 201 })
  } catch (error) {
    console.error("Error creating policy:", error)
    return NextResponse.json({ message: "Error creating policy" }, { status: 500 })
  }
}

