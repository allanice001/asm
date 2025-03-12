import { NextResponse } from "next/server"
import { getOrganizationsClient } from "@/lib/aws-client"
import { ListAccountsCommand } from "@aws-sdk/client-organizations"

// API route to list AWS accounts
export async function GET() {
  try {
    const organizationsClient = getOrganizationsClient()

    const response = await organizationsClient.send(new ListAccountsCommand({}))

    return NextResponse.json({
      accounts:
        response.Accounts?.map((account) => ({
          id: account.Id,
          name: account.Name,
          email: account.Email,
          status: account.Status,
        })) || [],
    })
  } catch (error) {
    console.error("Error fetching AWS accounts:", error)
    return NextResponse.json({ error: "Failed to fetch AWS accounts" }, { status: 500 })
  }
}

// API route to deploy roles and permission sets
export async function POST(request: Request) {
  try {
    // Parse the request body
    const requestBody = await request.json()

    // Log the deployment request for debugging
    console.log("Deployment request received:", requestBody)

    // This is a simplified implementation that just returns a success response
    // In a real implementation, you would use the AWS clients to deploy resources

    return NextResponse.json({
      success: true,
      message: "Deployment initiated successfully",
      deploymentId: `deploy-${Date.now()}`,
    })
  } catch (error) {
    console.error("Error deploying AWS resources:", error)
    return NextResponse.json({ error: "Failed to deploy AWS resources" }, { status: 500 })
  }
}

