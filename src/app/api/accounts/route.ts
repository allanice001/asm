import {NextResponse} from "next/server"
import {getServerSession} from "next-auth"
import {authOptions} from "@/lib/auth"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all accounts
    let accounts = []

    try {
      // Try to get accounts from the database
      accounts = await prisma.account.findMany({
        orderBy: {
          name: "asc",
        },
      })
    } catch (error) {
      console.error("Error fetching accounts:", error)
    }

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error("Error in accounts API:", error)
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}

