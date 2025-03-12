import { NextResponse } from "next/server"
import { getOrganizationsClient } from "@/lib/aws-client"
import { prisma } from "@/lib/prisma"
import {
  ListAccountsCommand,
  ListRootsCommand,
  ListAccountsForParentCommand,
  ListOrganizationalUnitsForParentCommand,
} from "@aws-sdk/client-organizations"

// API route to list and sync AWS accounts
export async function GET() {
  try {
    const organizationsClient = getOrganizationsClient()

    // Fetch accounts from AWS Organizations
    const response = await organizationsClient.send(new ListAccountsCommand({}))

    // Fetch OUs for accounts
    const accountOUs = new Map()

    // List roots to get the root ID
    const rootsResponse = await organizationsClient.send(new ListRootsCommand({}))
    if (!rootsResponse.Roots || rootsResponse.Roots.length === 0) {
      throw new Error("No organization roots found")
    }

    const rootId = rootsResponse.Roots[0].Id

    if (!rootId) {
      throw new Error("Could not determine organization root ID")
    }

    console.log(`Using root ID for accounts: ${rootId}`)

    // Function to recursively fetch accounts in OUs
    const fetchAccountsInOU = async (ouId: string, ouName: string, ouPath: string) => {
      const accountsResponse = await organizationsClient.send(
        new ListAccountsForParentCommand({
          ParentId: ouId,
        }),
      )

      if (accountsResponse.Accounts) {
        for (const account of accountsResponse.Accounts) {
          if (account.Id) {
            accountOUs.set(account.Id, {
              ouId,
              ouName,
              ouPath,
            })
          }
        }
      }

      // Fetch child OUs
      const childOUsResponse = await organizationsClient.send(
        new ListOrganizationalUnitsForParentCommand({
          ParentId: ouId,
        }),
      )

      if (childOUsResponse.OrganizationalUnits) {
        for (const ou of childOUsResponse.OrganizationalUnits) {
          const childPath = `${ouPath}/${ou.Name}`
          await fetchAccountsInOU(ou.Id, ou.Name, childPath)
        }
      }
    }

    // Fetch accounts directly under root
    const rootAccountsResponse = await organizationsClient.send(
      new ListAccountsForParentCommand({
        ParentId: rootId,
      }),
    )

    if (rootAccountsResponse.Accounts) {
      for (const account of rootAccountsResponse.Accounts) {
        if (account.Id) {
          accountOUs.set(account.Id, {
            ouId: rootId,
            ouName: "Root",
            ouPath: "/",
          })
        }
      }
    }

    // Fetch accounts in OUs
    const ousResponse = await organizationsClient.send(
      new ListOrganizationalUnitsForParentCommand({
        ParentId: rootId,
      }),
    )

    if (ousResponse.OrganizationalUnits) {
      for (const ou of ousResponse.OrganizationalUnits) {
        await fetchAccountsInOU(ou.Id, ou.Name, `/${ou.Name}`)
      }
    }

    // Sync accounts with database
    if (response.Accounts) {
      for (const account of response.Accounts) {
        if (account.Id && account.Name) {
          const ouInfo = accountOUs.get(account.Id) || {
            ouId: null,
            ouName: null,
            ouPath: null,
          }

          await prisma.account.upsert({
            where: { id: account.Id },
            update: {
              name: account.Name,
              email: account.Email,
              status: account.Status,
              ouId: ouInfo.ouId,
              ouName: ouInfo.ouName,
              ouPath: ouInfo.ouPath,
              lastUpdated: new Date(),
            },
            create: {
              id: account.Id,
              name: account.Name,
              email: account.Email,
              status: account.Status,
              ouId: ouInfo.ouId,
              ouName: ouInfo.ouName,
              ouPath: ouInfo.ouPath,
            },
          })
        }
      }
    }

    // Fetch accounts from database
    const accounts = await prisma.account.findMany({
      include: {
        permissionSetAssignments: {
          include: {
            permissionSet: true,
          },
        },
      },
    })

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error("Error fetching AWS accounts:", error)
    return NextResponse.json({ error: "Failed to fetch AWS accounts" }, { status: 500 })
  }
}

