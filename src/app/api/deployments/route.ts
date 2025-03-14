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
          // Include only the relations that exist in your schema
          deployments: true,
          changeHistory: true,
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
          // Include only the relations that exist in your schema
          deployments: true,
          changeHistory: true,
          assignments: true,
        },
      })

      if (!permissionSet) {
        return NextResponse.json({ error: "Permission Set not found" }, { status: 404 })
      }

      deploymentName = permissionSet.name
      deploymentDetails = permissionSet
    }

    // Create deployments in database
    const deployments = []

    for (const accountId of accountIds) {
      // Check if the account exists
      let account
      try {
        // Try to find the account by ID
        account = await prisma.account.findFirst({
          where: {
            id: accountId,
          },
        })

        if (!account) {
          console.warn(`Account with ID ${accountId} not found, skipping`)
          continue
        }
      } catch (error) {
        console.error(`Error finding account with ID ${accountId}:`, error)
        continue
      }

      // Create the deployment with the found account
      try {
        // Create deployment record based on the available fields in your schema
        const deploymentData = {
          accounts: {
            connect: [{ id: account.id }],
          },
          // Only include fields that exist in your schema
          logs: JSON.stringify({
            deploymentType: type,
            action: action,
            name: deploymentName,
            details: deploymentDetails,
            timestamp: new Date().toISOString(),
            status: "COMPLETED",
          }),
        }

        // Add role or permission set connection if applicable
        if (type === "ROLE" && roleId) {
          deploymentData.roles = { connect: [{ id: roleId }] }
        } else if (type === "PERMISSION_SET" && permissionSetId) {
          deploymentData.permissionSets = { connect: [{ id: permissionSetId }] }
        }

        // Add user connection if available
        if (session.user?.email) {
          const user = await prisma.user.findUnique({
            where: { email: session.user.email },
          })

          if (user) {
            deploymentData.initiatedByUser = { connect: { id: user.id } }
          }
        }

        const deployment = await prisma.deployment.create({
          data: deploymentData,
        })

        // Create a log entry for the deployment
        await prisma.deploymentLog.create({
          data: {
            deployment: { connect: { id: deployment.id } },
            message: `Direct deployment of ${type.toLowerCase()} ${deploymentName} to account ${accountId}`,
            level: "INFO",
            details: JSON.stringify({
              accountId,
              type,
              action,
              deploymentName,
            }),
          },
        })

        deployments.push(deployment)
      } catch (error) {
        console.error(`Error creating deployment for account ${accountId}:`, error)
      }
    }

    return NextResponse.json({
      message: "Deployments completed successfully",
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
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Build query
    const where: any = {}

    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId },
      })

      if (account) {
        where.accounts = {
          some: {
            id: account.id,
          },
        }
      }
    }

    // Get deployments
    const deployments = await prisma.deployment.findMany({
      where,
      include: {
        accounts: true,
        roles: true,
        permissionSets: true,
        initiatedByUser: true,
        deploymentLogs: true,
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

