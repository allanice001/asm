import { NextResponse } from "next/server"
import { getOrganizationsClient } from "@/lib/aws-client"
import { prisma } from "@/lib/prisma"
import { ListOrganizationalUnitsForParentCommand, ListRootsCommand } from "@aws-sdk/client-organizations"

// Helper function to build OU tree
function buildOUTree(ous: any[], accounts: any[], rootId: string) {
  // Create a map of OUs by ID
  const ouMap = new Map()

  // Initialize all OUs with empty children and accounts arrays
  ous.forEach((ou) => {
    ouMap.set(ou.Id, {
      id: ou.Id,
      name: ou.Name,
      path: ou.Path || `/${ou.Name}`,
      children: [],
      accounts: [],
    })
  })

  // Add root if not present
  if (!ouMap.has(rootId)) {
    ouMap.set(rootId, {
      id: rootId,
      name: "Root",
      path: "/",
      children: [],
      accounts: [],
    })
  }

  // Build the tree structure
  ous.forEach((ou) => {
    const parentId = ou.ParentId || rootId
    if (ouMap.has(parentId)) {
      const parent = ouMap.get(parentId)
      parent.children.push(ouMap.get(ou.Id))
    }
  })

  // Add accounts to their respective OUs
  accounts.forEach((account) => {
    if (account.ouId && ouMap.has(account.ouId)) {
      ouMap.get(account.ouId).accounts.push({
        id: account.id,
        name: account.name,
      })
    } else {
      // If account doesn't have an OU or OU not found, add to root
      ouMap.get(rootId).accounts.push({
        id: account.id,
        name: account.name,
      })
    }
  })

  // Return the root OU's children as the tree
  return [ouMap.get(rootId)]
}

export async function GET() {
  try {
    const organizationsClient = getOrganizationsClient()

    // First, fetch the actual root ID instead of using a hardcoded value
    const listRootsResponse = await organizationsClient.send(new ListRootsCommand({}))

    if (!listRootsResponse.Roots || listRootsResponse.Roots.length === 0) {
      return NextResponse.json({ error: "No organization roots found" }, { status: 500 })
    }

    const rootId = listRootsResponse.Roots[0].Id

    if (!rootId) {
      return NextResponse.json({ error: "Could not determine organization root ID" }, { status: 500 })
    }

    console.log(`Using root ID: ${rootId}`)

    // Fetch OUs from AWS Organizations using the actual root ID
    const listOUsResponse = await organizationsClient.send(
      new ListOrganizationalUnitsForParentCommand({
        ParentId: rootId,
      }),
    )

    // Recursively fetch all OUs
    const allOUs = []

    if (listOUsResponse.OrganizationalUnits) {
      allOUs.push(...listOUsResponse.OrganizationalUnits)

      // For each OU, fetch its children
      for (const ou of listOUsResponse.OrganizationalUnits) {
        const childOUsResponse = await organizationsClient.send(
          new ListOrganizationalUnitsForParentCommand({
            ParentId: ou.Id,
          }),
        )

        if (childOUsResponse.OrganizationalUnits) {
          // Add parent ID to each child OU
          const childOUs = childOUsResponse.OrganizationalUnits.map((childOU) => ({
            ...childOU,
            ParentId: ou.Id,
            Path: `/${ou.Name}/${childOU.Name}`,
          }))

          allOUs.push(...childOUs)
        }
      }
    }

    // Fetch accounts from database
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        ouId: true,
      },
    })

    // Build OU tree using the actual root ID
    const ouStructure = buildOUTree(allOUs, accounts, rootId)

    return NextResponse.json({ ouStructure })
  } catch (error) {
    console.error("Error fetching organization structure:", error)
    return NextResponse.json({ error: "Failed to fetch organization structure" }, { status: 500 })
  }
}