import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enqueueDeployment } from "@/lib/deployment-service"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { accountIds, roleId, permissionSetId, type, action } = body

    // Validate required fields
    if (!accountIds || !accountIds.length) {
      return NextResponse.json({ error: "Account IDs are required" }, { status: 400 })
    }

    if (!type || !["ROLE", "PERMISSION_SET"].includes(type)) {
      return NextResponse.json({ error: "Valid deployment type is required" }, { status: 400 })
    }

    if (!action || !["CREATE", "UPDATE", "DELETE"].includes(action)) {
      return NextResponse.json({ error: "Valid deployment action is required" }, { status: 400 })
    }

    if (type === "ROLE" && !roleId) {
      return NextResponse.json({ error: "Role IDs are required for role deployments" }, { status: 400 })
    }

    if (type === "PERMISSION_SET" && !permissionSetId) {
      return NextResponse.json(
        { error: "Permission Set IDs are required for permission set deployments" },
        { status: 400 },
      )
    }

    // Get role or permission set details
    let deploymentName = ""
    let deploymentDetails = {}

    if (type === "ROLE") {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          policies: true,
        },
      })

      if (!role) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 })
      }

      deploymentName = role.name
      deploymentDetails = role
    } else {
      const permissionSet = await prisma.permissionSet.findUnique({
        where: { id: permissionSetId },
        include: {
          policies: true,
        },
      })

      if (!permissionSet) {
        return NextResponse.json({ error: "Permission Set not found" }, { status: 404 })
      }

      deploymentName = permissionSet.name
      deploymentDetails = permissionSet
    }

    // Get AWS settings
    const awsSettings = await prisma.awsSettings.findFirst()
    if (!awsSettings) {
      return NextResponse.json({ error: "AWS settings not configured" }, { status: 400 })
    }

    // Create deployments in database
    const deployments = []

    for (const accountId of accountIds) {
      const account = await prisma.account.findUnique({
        where: { accountId },
      })

      if (!account) {
        continue
      }

      const deployment = await prisma.deployment.create({
        data: {
          accountId: account.id,
          roleId: type === "ROLE" ? roleId : null,
          permissionSetId: type === "PERMISSION_SET" ? permissionSetId : null,
          type,
          action,
          status: "PENDING",
          name: deploymentName,
          details: JSON.stringify(deploymentDetails),
          createdBy: session.user.email || "system",
        },
      })

      deployments.push(deployment)

      // Enqueue each deployment for processing
      await enqueueDeployment(deployment.id)
    }

    return NextResponse.json({
      message: "Deployments created and queued for processing",
      deployments,
    })
  } catch (error) {
    console.error("Error creating deployments:", error)
    return NextResponse.json({ error: "Failed to create deployments" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("accountId")
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Build query
    const where: any = {}

    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { accountId },
      })
      if (account) {
        where.accountId = account.id
      }
    }

    if (status && ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"].includes(status)) {
      where.status = status
    }

    if (type && ["ROLE", "PERMISSION_SET"].includes(type)) {
      where.type = type
    }

    // Get deployments
    const deployments = await prisma.deployment.findMany({
      where,
      include: {
        account: true,
        role: true,
        permissionSet: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    })

    // Get total count
    const totalCount = await prisma.deployment.count({ where })

    return NextResponse.json({
      deployments,
      totalCount,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching deployments:", error)
    return NextResponse.json({ error: "Failed to fetch deployments" }, { status: 500 })
  }
}

