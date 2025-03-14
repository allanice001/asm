import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Define report period types
type ReportPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM"

export async function GET(request: NextRequest) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Parse query parameters
		const { searchParams } = new URL(request.url)
		const period = searchParams.get("period") as ReportPeriod | null
		const limit = Number.parseInt(searchParams.get("limit") || "10")
		const offset = Number.parseInt(searchParams.get("offset") || "0")

		// Build query
		const where: any = {}
		if (period) {
			where.period = period
		}

		// Get reports
		const reports = await prisma.deploymentReport.findMany({
			where,
			orderBy: {
				createdAt: "desc",
			},
			take: limit,
			skip: offset,
		})

		// Get total count
		const totalCount = await prisma.deploymentReport.count({ where })

		return NextResponse.json({
			reports,
			totalCount,
			limit,
			offset,
		})
	} catch (error) {
		console.error("Error fetching reports:", error)
		return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Parse request body
		const body = await request.json()
		const { name, period, startDate, endDate, isScheduled } = body

		// Validate required fields
		if (!name) {
			return NextResponse.json({ error: "Report name is required" }, { status: 400 })
		}

		if (!period || !["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"].includes(period)) {
			return NextResponse.json({ error: "Valid report period is required" }, { status: 400 })
		}

		// Parse dates
		const parsedStartDate = startDate ? new Date(startDate) : new Date()
		let parsedEndDate = endDate ? new Date(endDate) : new Date()

		// If no custom dates provided, calculate based on period
		if (!startDate) {
			if (period === "DAILY") {
				parsedStartDate.setHours(0, 0, 0, 0)
			} else if (period === "WEEKLY") {
				const day = parsedStartDate.getDay()
				parsedStartDate.setDate(parsedStartDate.getDate() - day)
				parsedStartDate.setHours(0, 0, 0, 0)
			} else if (period === "MONTHLY") {
				parsedStartDate.setDate(1)
				parsedStartDate.setHours(0, 0, 0, 0)
			}
		}

		if (!endDate) {
			parsedEndDate = new Date()
		}

		// Generate report data
		const reportData = await generateReportData(parsedStartDate, parsedEndDate)

		// Create report in database
		const report = await prisma.deploymentReport.create({
			data: {
				name,
				period,
				startDate: parsedStartDate,
				endDate: parsedEndDate,
				data: JSON.stringify(reportData),
				createdBy: session.user.email || "system",
				isScheduled: isScheduled || false,
			},
		})

		return NextResponse.json({
			message: "Report generated successfully",
			report,
		})
	} catch (error) {
		console.error("Error generating report:", error)
		return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
	}
}

// Function to generate report data
async function generateReportData(startDate: Date, endDate: Date) {
	// Get all deployments in the date range
	const deployments = await prisma.deployment.findMany({
		where: {
			createdAt: {
				gte: startDate,
				lte: endDate,
			},
		},
		include: {
			// Use the correct field names as shown in the error message
			accounts: true,
			roles: true,
			permissionSets: true,
		},
	})

	// Get all accounts
	const accounts = await prisma.account.findMany()
	const accountMap = new Map(accounts.map((account) => [account.id, account]))

	// Calculate success rates by account
	const accountStats = new Map()
	accounts.forEach((account) => {
		accountStats.set(account.id, {
			id: account.id,
			name: account.name,
			accountId: account.id, // Using id as accountId since that's what we have
			total: 0,
			successful: 0,
			failed: 0,
			pending: 0,
			successRate: 0,
		})
	})

	// Calculate success rates by role
	const roles = await prisma.role.findMany()
	const roleStats = new Map()
	roles.forEach((role) => {
		roleStats.set(role.id, {
			id: role.id,
			name: role.name,
			total: 0,
			successful: 0,
			failed: 0,
			pending: 0,
			successRate: 0,
		})
	})

	// Calculate success rates by permission set
	const permissionSets = await prisma.permissionSet.findMany()
	const permissionSetStats = new Map()
	permissionSets.forEach((ps) => {
		permissionSetStats.set(ps.id, {
			id: ps.id,
			name: ps.name,
			total: 0,
			successful: 0,
			failed: 0,
			pending: 0,
			successRate: 0,
		})
	})

	// Daily trend data
	const dailyTrend = new Map()

	// Process deployments
	deployments.forEach((deployment) => {
		// Extract status from logs if available
		let status = "PENDING"
		if (deployment.logs) {
			try {
				const logs = JSON.parse(deployment.logs)
				status = logs.status || "PENDING"
			} catch (e) {
				console.error("Error parsing deployment logs:", e)
			}
		}

		const date = new Date(deployment.createdAt)
		const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

		// Initialize daily trend data if not exists
		if (!dailyTrend.has(dateKey)) {
			dailyTrend.set(dateKey, {
				date: dateKey,
				total: 0,
				successful: 0,
				failed: 0,
				pending: 0,
				successRate: 0,
			})
		}

		const dailyData = dailyTrend.get(dateKey)
		dailyData.total++

		// Update account stats for each connected account
		if (deployment.accounts && deployment.accounts.length > 0) {
			deployment.accounts.forEach((account) => {
				const accountStat = accountStats.get(account.id)
				if (accountStat) {
					accountStat.total++

					if (status === "COMPLETED") {
						accountStat.successful++
						dailyData.successful++
					} else if (status === "FAILED") {
						accountStat.failed++
						dailyData.failed++
					} else {
						accountStat.pending++
						dailyData.pending++
					}

					accountStat.successRate =
						accountStat.total > 0 ? Math.round((accountStat.successful / accountStat.total) * 100) : 0
				}
			})
		}

		// Update role stats for each connected role
		if (deployment.roles && deployment.roles.length > 0) {
			deployment.roles.forEach((role) => {
				const roleStat = roleStats.get(role.id)
				if (roleStat) {
					roleStat.total++

					if (status === "COMPLETED") {
						roleStat.successful++
					} else if (status === "FAILED") {
						roleStat.failed++
					} else {
						roleStat.pending++
					}

					roleStat.successRate = roleStat.total > 0 ? Math.round((roleStat.successful / roleStat.total) * 100) : 0
				}
			})
		}

		// Update permission set stats for each connected permission set
		if (deployment.permissionSets && deployment.permissionSets.length > 0) {
			deployment.permissionSets.forEach((ps) => {
				const psStat = permissionSetStats.get(ps.id)
				if (psStat) {
					psStat.total++

					if (status === "COMPLETED") {
						psStat.successful++
					} else if (status === "FAILED") {
						psStat.failed++
					} else {
						psStat.pending++
					}

					psStat.successRate = psStat.total > 0 ? Math.round((psStat.successful / psStat.total) * 100) : 0
				}
			})
		}

		// Update daily success rate
		dailyData.successRate = dailyData.total > 0 ? Math.round((dailyData.successful / dailyData.total) * 100) : 0
	})

	// Calculate overall stats
	const totalDeployments = deployments.length

	// Count successful deployments based on status in logs
	const successfulDeployments = deployments.filter((d) => {
		if (d.logs) {
			try {
				const logs = JSON.parse(d.logs)
				return logs.status === "COMPLETED"
			} catch (e) {
				return false
			}
		}
		return false
	}).length

	// Count failed deployments based on status in logs
	const failedDeployments = deployments.filter((d) => {
		if (d.logs) {
			try {
				const logs = JSON.parse(d.logs)
				return logs.status === "FAILED"
			} catch (e) {
				return false
			}
		}
		return false
	}).length

	// Count pending deployments based on status in logs
	const pendingDeployments = deployments.filter((d) => {
		if (d.logs) {
			try {
				const logs = JSON.parse(d.logs)
				return logs.status === "PENDING" || logs.status === "IN_PROGRESS"
			} catch (e) {
				return true // Default to pending if can't parse
			}
		}
		return true // Default to pending if no logs
	}).length

	const overallSuccessRate = totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 0

	// Find top 5 problematic accounts (lowest success rates with at least 5 deployments)
	const problematicAccounts = Array.from(accountStats.values())
		.filter((account) => account.total >= 5)
		.sort((a, b) => a.successRate - b.successRate)
		.slice(0, 5)

	// Find top 5 problematic roles (lowest success rates with at least 3 deployments)
	const problematicRoles = Array.from(roleStats.values())
		.filter((role) => role.total >= 3)
		.sort((a, b) => a.successRate - b.successRate)
		.slice(0, 5)

	// Find top 5 problematic permission sets (lowest success rates with at least 3 deployments)
	const problematicPermissionSets = Array.from(permissionSetStats.values())
		.filter((ps) => ps.total >= 3)
		.sort((a, b) => a.successRate - b.successRate)
		.slice(0, 5)

	// Sort daily trend by date
	const sortedDailyTrend = Array.from(dailyTrend.values()).sort((a, b) => a.date.localeCompare(b.date))

	return {
		summary: {
			totalDeployments,
			successfulDeployments,
			failedDeployments,
			pendingDeployments,
			overallSuccessRate,
			startDate,
			endDate,
		},
		accountStats: Array.from(accountStats.values()),
		roleStats: Array.from(roleStats.values()),
		permissionSetStats: Array.from(permissionSetStats.values()),
		problematicAccounts,
		problematicRoles,
		problematicPermissionSets,
		dailyTrend: sortedDailyTrend,
	}
}

