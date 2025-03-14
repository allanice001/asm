import {NextResponse} from "next/server"
import {getServerSession} from "next-auth"
import {authOptions} from "@/lib/auth"
import {prisma} from "@/lib/prisma"
import {
	ListAccountsCommand,
	ListOrganizationalUnitsForParentCommand,
	OrganizationsClient,
} from "@aws-sdk/client-organizations"
import {getOrganizationsClient} from "@/lib/aws-client";

export async function POST() {
	try {
		// Check authentication
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Create AWS Organizations client
		const organizationsClient = getOrganizationsClient()

		// Fetch all accounts from AWS Organizations
		const awsAccounts = await fetchAllAccounts(organizationsClient)

		// Fetch OU structure to get OU information for each account
		const ouMap = await fetchOUStructure(organizationsClient)

		// Sync accounts with database
		const result = await syncAccountsWithDatabase(awsAccounts, ouMap)

		return NextResponse.json({
			message: "Accounts synced successfully",
			stats: result,
		})
	} catch (error) {
		console.error("Error syncing accounts:", error)
		return NextResponse.json(
			{
				error: "Failed to sync accounts",
				details: error.message,
			},
			{ status: 500 },
		)
	}
}

// Fetch all accounts from AWS Organizations with pagination
async function fetchAllAccounts(client: OrganizationsClient) {
	const accounts = []
	let nextToken = undefined

	do {
		try {
			const command = new ListAccountsCommand({
				NextToken: nextToken,
			})

			const response = await client.send(command)

			if (response.Accounts && response.Accounts.length > 0) {
				accounts.push(...response.Accounts)
			}

			nextToken = response.NextToken
		} catch (error) {
			console.error("Error fetching accounts from AWS:", error)
			throw error
		}
	} while (nextToken)

	return accounts
}

// Fetch OU structure to map accounts to OUs
async function fetchOUStructure(client: OrganizationsClient) {
	const ouMap = new Map()

	// Start with the root OU
	try {
		// Get the organization root ID
		const rootId = "r-xxxx" // Replace with actual root ID or fetch it

		// Recursively fetch OUs
		await fetchOUsRecursively(client, rootId, "", ouMap)
	} catch (error) {
		console.error("Error fetching OU structure:", error)
	}

	return ouMap
}

// Recursively fetch OUs and build the OU map
async function fetchOUsRecursively(
	client: OrganizationsClient,
	parentId: string,
	parentPath: string,
	ouMap: Map<string, { id: string; name: string; path: string }>,
) {
	try {
		const command = new ListOrganizationalUnitsForParentCommand({
			ParentId: parentId,
		})

		const response = await client.send(command)

		if (response.OrganizationalUnits) {
			for (const ou of response.OrganizationalUnits) {
				if (ou.Id && ou.Name) {
					const path = parentPath ? `${parentPath}/${ou.Name}` : ou.Name

					ouMap.set(ou.Id, {
						id: ou.Id,
						name: ou.Name,
						path: path,
					})

					// Recursively fetch child OUs
					await fetchOUsRecursively(client, ou.Id, path, ouMap)
				}
			}
		}
	} catch (error) {
		console.error(`Error fetching OUs for parent ${parentId}:`, error)
	}
}

// Sync accounts with database
async function syncAccountsWithDatabase(
	awsAccounts: any[],
	ouMap: Map<string, { id: string; name: string; path: string }>,
) {
	// Get existing accounts from database
	const existingAccounts = await prisma.account.findMany()
	const existingAccountMap = new Map(existingAccounts.map((acc) => [acc.id, acc]))

	// Track sync statistics
	const stats = {
		total: awsAccounts.length,
		created: 0,
		updated: 0,
		unchanged: 0,
		errors: 0,
	}

	// Process each AWS account
	for (const awsAccount of awsAccounts) {
		try {
			// Skip accounts that are not ACTIVE
			if (awsAccount.Status !== "ACTIVE") {
				continue
			}

			const accountId = awsAccount.Id
			const existingAccount = existingAccountMap.get(accountId)

			// Get OU information if available
			const ouInfo = awsAccount.ParentId ? ouMap.get(awsAccount.ParentId) : null

			// Prepare account data
			const accountData = {
				name: awsAccount.Name,
				email: awsAccount.Email,
				status: awsAccount.Status,
				ouId: ouInfo?.id || null,
				ouName: ouInfo?.name || null,
				ouPath: ouInfo?.path || null,
				lastUpdated: new Date(),
			}

			if (existingAccount) {
				// Update existing account
				await prisma.account.update({
					where: { id: accountId },
					data: accountData,
				})
				stats.updated++
			} else {
				// Create new account
				await prisma.account.create({
					data: {
						id: accountId,
						...accountData,
					},
				})
				stats.created++
			}
		} catch (error) {
			console.error(`Error syncing account ${awsAccount.Id}:`, error)
			stats.errors++
		}
	}

	stats.unchanged = stats.total - stats.created - stats.updated - stats.errors

	return stats
}

