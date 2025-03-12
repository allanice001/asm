"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Calendar, Download, Filter, Plus } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"

type Report = {
	id: string
	name: string
	period: string
	startDate: string
	endDate: string
	createdAt: string
	data: string
	createdBy: string
	isScheduled: boolean
}

type ReportData = {
	summary: {
		totalDeployments: number
		successfulDeployments: number
		failedDeployments: number
		pendingDeployments: number
		overallSuccessRate: number
		startDate: string
		endDate: string
	}
	accountStats: Array<{
		id: string
		name: string
		accountId: string
		total: number
		successful: number
		failed: number
		pending: number
		successRate: number
	}>
	roleStats: Array<{
		id: string
		name: string
		total: number
		successful: number
		failed: number
		pending: number
		successRate: number
	}>
	permissionSetStats: Array<{
		id: string
		name: string
		total: number
		successful: number
		failed: number
		pending: number
		successRate: number
	}>
	problematicAccounts: Array<{
		id: string
		name: string
		accountId: string
		total: number
		successful: number
		failed: number
		pending: number
		successRate: number
	}>
	problematicRoles: Array<{
		id: string
		name: string
		total: number
		successful: number
		failed: number
		pending: number
		successRate: number
	}>
	problematicPermissionSets: Array<{
		id: string
		name: string
		total: number
		successful: number
		failed: number
		pending: number
		successRate: number
	}>
	dailyTrend: Array<{
		date: string
		total: number
		successful: number
		failed: number
		pending: number
		successRate: number
	}>
}

export function DeploymentReports() {
	const [reports, setReports] = useState<Report[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedReport, setSelectedReport] = useState<Report | null>(null)
	const [reportData, setReportData] = useState<ReportData | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)

	// Form state for creating a new report
	const [newReportName, setNewReportName] = useState("")
	const [newReportPeriod, setNewReportPeriod] = useState("WEEKLY")
	const [newReportStartDate, setNewReportStartDate] = useState<Date | undefined>(undefined)
	const [newReportEndDate, setNewReportEndDate] = useState<Date | undefined>(undefined)

	// Form state for scheduling a report
	const [scheduleReportName, setScheduleReportName] = useState("")
	const [scheduleReportPeriod, setScheduleReportPeriod] = useState("WEEKLY")
	const [scheduleReportFrequency, setScheduleReportFrequency] = useState("WEEKLY")
	const [scheduleReportRecipients, setScheduleReportRecipients] = useState("")

	// Filters for account stats
	const [accountFilter, setAccountFilter] = useState("")
	const [roleFilter, setRoleFilter] = useState("")
	const [permissionSetFilter, setPermissionSetFilter] = useState("")
	const [successRateFilter, setSuccessRateFilter] = useState("")

	// Fetch reports
	useEffect(() => {
		fetchReports()
	}, [])

	const fetchReports = async () => {
		setLoading(true)
		try {
			const response = await fetch("/api/reports")
			const data = await response.json()
			setReports(data.reports || [])
		} catch (error) {
			console.error("Error fetching reports:", error)
		} finally {
			setLoading(false)
		}
	}

	const handleViewReport = (report: Report) => {
		setSelectedReport(report)
		try {
			const parsedData = JSON.parse(report.data) as ReportData
			setReportData(parsedData)
		} catch (error) {
			console.error("Error parsing report data:", error)
			setReportData(null)
		}
		setIsDialogOpen(true)
	}

	const handleCreateReport = async () => {
		try {
			const response = await fetch("/api/reports", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: newReportName,
					period: newReportPeriod,
					startDate: newReportStartDate,
					endDate: newReportEndDate,
				}),
			})

			if (!response.ok) {
				throw new Error("Failed to create report")
			}

			// Reset form and close dialog
			setNewReportName("")
			setNewReportPeriod("WEEKLY")
			setNewReportStartDate(undefined)
			setNewReportEndDate(undefined)
			setIsCreateDialogOpen(false)

			// Refresh reports
			fetchReports()
		} catch (error) {
			console.error("Error creating report:", error)
		}
	}

	const handleScheduleReport = async () => {
		try {
			const response = await fetch("/api/reports/schedule", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: scheduleReportName,
					period: scheduleReportPeriod,
					schedule: scheduleReportFrequency,
					recipients: scheduleReportRecipients.split(",").map((email) => email.trim()),
				}),
			})

			if (!response.ok) {
				throw new Error("Failed to schedule report")
			}

			// Reset form and close dialog
			setScheduleReportName("")
			setScheduleReportPeriod("WEEKLY")
			setScheduleReportFrequency("WEEKLY")
			setScheduleReportRecipients("")
			setIsScheduleDialogOpen(false)

			// Refresh reports
			fetchReports()
		} catch (error) {
			console.error("Error scheduling report:", error)
		}
	}

	const exportReportToCsv = () => {
		if (!reportData) return

		// Create CSV content
		let csvContent = "data:text/csv;charset=utf-8,"

		// Add summary
		csvContent += "Summary\n"
		csvContent += `Total Deployments,${reportData.summary.totalDeployments}\n`
		csvContent += `Successful Deployments,${reportData.summary.successfulDeployments}\n`
		csvContent += `Failed Deployments,${reportData.summary.failedDeployments}\n`
		csvContent += `Pending Deployments,${reportData.summary.pendingDeployments}\n`
		csvContent += `Overall Success Rate,${reportData.summary.overallSuccessRate}%\n\n`

		// Add account stats
		csvContent += "Account Stats\n"
		csvContent += "Account ID,Account Name,Total,Successful,Failed,Pending,Success Rate\n"
		reportData.accountStats.forEach((account) => {
			csvContent += `${account.accountId},${account.name},${account.total},${account.successful},${account.failed},${account.pending},${account.successRate}%\n`
		})
		csvContent += "\n"

		// Add role stats
		csvContent += "Role Stats\n"
		csvContent += "Role Name,Total,Successful,Failed,Pending,Success Rate\n"
		reportData.roleStats.forEach((role) => {
			csvContent += `${role.name},${role.total},${role.successful},${role.failed},${role.pending},${role.successRate}%\n`
		})
		csvContent += "\n"

		// Add permission set stats
		csvContent += "Permission Set Stats\n"
		csvContent += "Permission Set Name,Total,Successful,Failed,Pending,Success Rate\n"
		reportData.permissionSetStats.forEach((ps) => {
			csvContent += `${ps.name},${ps.total},${ps.successful},${ps.failed},${ps.pending},${ps.successRate}%\n`
		})
		csvContent += "\n"

		// Add daily trend
		csvContent += "Daily Trend\n"
		csvContent += "Date,Total,Successful,Failed,Pending,Success Rate\n"
		reportData.dailyTrend.forEach((day) => {
			csvContent += `${day.date},${day.total},${day.successful},${day.failed},${day.pending},${day.successRate}%\n`
		})

		// Create download link
		const encodedUri = encodeURI(csvContent)
		const link = document.createElement("a")
		link.setAttribute("href", encodedUri)
		link.setAttribute("download", `report-${selectedReport?.name.replace(/\s+/g, "-")}.csv`)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		}).format(date)
	}

	const getSuccessRateColor = (rate: number) => {
		if (rate >= 90) return "text-green-600"
		if (rate >= 75) return "text-amber-600"
		return "text-red-600"
	}

	const filterAccountStats = () => {
		if (!reportData) return []

		return reportData.accountStats.filter((account) => {
			// Filter by account name or ID
			const matchesAccount =
				!accountFilter ||
				account.name.toLowerCase().includes(accountFilter.toLowerCase()) ||
				account.accountId.includes(accountFilter)

			// Filter by success rate
			let matchesSuccessRate = true
			if (successRateFilter === "high") {
				matchesSuccessRate = account.successRate >= 90
			} else if (successRateFilter === "medium") {
				matchesSuccessRate = account.successRate >= 75 && account.successRate < 90
			} else if (successRateFilter === "low") {
				matchesSuccessRate = account.successRate < 75
			}

			return matchesAccount && matchesSuccessRate
		})
	}

	const filterRoleStats = () => {
		if (!reportData) return []

		return reportData.roleStats.filter((role) => {
			// Filter by role name
			const matchesRole = !roleFilter || role.name.toLowerCase().includes(roleFilter.toLowerCase())

			// Filter by success rate
			let matchesSuccessRate = true
			if (successRateFilter === "high") {
				matchesSuccessRate = role.successRate >= 90
			} else if (successRateFilter === "medium") {
				matchesSuccessRate = role.successRate >= 75 && role.successRate < 90
			} else if (successRateFilter === "low") {
				matchesSuccessRate = role.successRate < 75
			}

			return matchesRole && matchesSuccessRate
		})
	}

	const filterPermissionSetStats = () => {
		if (!reportData) return []

		return reportData.permissionSetStats.filter((ps) => {
			// Filter by permission set name
			const matchesPermissionSet =
				!permissionSetFilter || ps.name.toLowerCase().includes(permissionSetFilter.toLowerCase())

			// Filter by success rate
			let matchesSuccessRate = true
			if (successRateFilter === "high") {
				matchesSuccessRate = ps.successRate >= 90
			} else if (successRateFilter === "medium") {
				matchesSuccessRate = ps.successRate >= 75 && ps.successRate < 90
			} else if (successRateFilter === "low") {
				matchesSuccessRate = ps.successRate < 75
			}

			return matchesPermissionSet && matchesSuccessRate
		})
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle className="flex items-center gap-2">
						<BarChart className="h-5 w-5" />
						Deployment Reports
					</CardTitle>
					<CardDescription>Analyze deployment success rates across your organization</CardDescription>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => setIsScheduleDialogOpen(true)}>
						<Calendar className="h-4 w-4 mr-2" />
						Schedule Report
					</Button>
					<Button onClick={() => setIsCreateDialogOpen(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Generate Report
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="flex justify-center py-6">
						<div className="animate-pulse text-muted-foreground">Loading reports...</div>
					</div>
				) : (
					<>
						{reports.length === 0 ? (
							<div className="text-center py-6 text-muted-foreground">
								No reports found. Generate your first report!
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Report Name</TableHead>
										<TableHead>Period</TableHead>
										<TableHead>Date Range</TableHead>
										<TableHead>Created</TableHead>
										<TableHead>Type</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reports.map((report) => (
										<TableRow key={report.id}>
											<TableCell className="font-medium">{report.name}</TableCell>
											<TableCell>{report.period}</TableCell>
											<TableCell>
												{formatDate(report.startDate)} - {formatDate(report.endDate)}
											</TableCell>
											<TableCell>{formatDate(report.createdAt)}</TableCell>
											<TableCell>
												{report.isScheduled ? (
													<Badge variant="outline" className="bg-blue-50">
														Scheduled
													</Badge>
												) : (
													<Badge variant="outline">On-demand</Badge>
												)}
											</TableCell>
											<TableCell className="text-right">
												<Button variant="ghost" size="sm" onClick={() => handleViewReport(report)}>
													View Report
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</>
				)}

				{/* Report details dialog */}
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
						{selectedReport && reportData && (
							<>
								<DialogHeader>
									<DialogTitle>{selectedReport.name}</DialogTitle>
									<DialogDescription>
										{formatDate(selectedReport.startDate)} - {formatDate(selectedReport.endDate)}
									</DialogDescription>
								</DialogHeader>
								<div className="py-4">
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
										<Card className="bg-muted/30">
											<CardContent className="p-4">
												<div className="text-sm font-medium text-muted-foreground">Total Deployments</div>
												<div className="text-2xl font-bold">{reportData.summary.totalDeployments}</div>
											</CardContent>
										</Card>
										<Card className="bg-muted/30">
											<CardContent className="p-4">
												<div className="text-sm font-medium text-muted-foreground">Success Rate</div>
												<div
													className={`text-2xl font-bold ${getSuccessRateColor(reportData.summary.overallSuccessRate)}`}
												>
													{reportData.summary.overallSuccessRate}%
												</div>
											</CardContent>
										</Card>
										<Card className="bg-muted/30">
											<CardContent className="p-4">
												<div className="text-sm font-medium text-muted-foreground">Successful</div>
												<div className="text-2xl font-bold text-green-600">
													{reportData.summary.successfulDeployments}
												</div>
											</CardContent>
										</Card>
										<Card className="bg-muted/30">
											<CardContent className="p-4">
												<div className="text-sm font-medium text-muted-foreground">Failed</div>
												<div className="text-2xl font-bold text-red-600">{reportData.summary.failedDeployments}</div>
											</CardContent>
										</Card>
									</div>

									<Tabs defaultValue="overview">
										<TabsList className="mb-4">
											<TabsTrigger value="overview">Overview</TabsTrigger>
											<TabsTrigger value="accounts">Accounts</TabsTrigger>
											<TabsTrigger value="roles">Roles</TabsTrigger>
											<TabsTrigger value="permissionSets">Permission Sets</TabsTrigger>
											<TabsTrigger value="trends">Trends</TabsTrigger>
										</TabsList>

										<TabsContent value="overview" className="space-y-6">
											<div>
												<h3 className="text-lg font-medium mb-3">Deployment Summary</h3>
												<div className="mb-2">
													<div className="text-sm font-medium mb-1">Overall Success Rate</div>
													<div className="flex items-center">
														<Progress value={reportData.summary.overallSuccessRate} className="h-2 flex-1" />
														<span
															className={`ml-2 font-medium ${getSuccessRateColor(reportData.summary.overallSuccessRate)}`}
														>
                              {reportData.summary.overallSuccessRate}%
                            </span>
													</div>
												</div>
											</div>

											{reportData.problematicAccounts.length > 0 && (
												<div>
													<h3 className="text-lg font-medium mb-3">Problematic Accounts</h3>
													<Table>
														<TableHeader>
															<TableRow>
																<TableHead>Account</TableHead>
																<TableHead>Total</TableHead>
																<TableHead>Success Rate</TableHead>
																<TableHead>Failed</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{reportData.problematicAccounts.map((account) => (
																<TableRow key={account.id}>
																	<TableCell>{account.name}</TableCell>
																	<TableCell>{account.total}</TableCell>
																	<TableCell className={getSuccessRateColor(account.successRate)}>
																		{account.successRate}%
																	</TableCell>
																	<TableCell>{account.failed}</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
											)}

											{reportData.problematicRoles.length > 0 && (
												<div>
													<h3 className="text-lg font-medium mb-3">Problematic Roles</h3>
													<Table>
														<TableHeader>
															<TableRow>
																<TableHead>Role</TableHead>
																<TableHead>Total</TableHead>
																<TableHead>Success Rate</TableHead>
																<TableHead>Failed</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{reportData.problematicRoles.map((role) => (
																<TableRow key={role.id}>
																	<TableCell>{role.name}</TableCell>
																	<TableCell>{role.total}</TableCell>
																	<TableCell className={getSuccessRateColor(role.successRate)}>
																		{role.successRate}%
																	</TableCell>
																	<TableCell>{role.failed}</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
											)}
										</TabsContent>

										<TabsContent value="accounts">
											<div className="flex justify-between items-center mb-4">
												<h3 className="text-lg font-medium">Account Success Rates</h3>
												<div className="flex gap-2">
													<div className="relative">
														<Input
															placeholder="Filter accounts..."
															value={accountFilter}
															onChange={(e) => setAccountFilter(e.target.value)}
															className="w-[200px]"
														/>
														<Filter className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
													</div>
													<Select value={successRateFilter} onValueChange={setSuccessRateFilter}>
														<SelectTrigger className="w-[150px]">
															<SelectValue placeholder="Success Rate" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="">All Rates</SelectItem>
															<SelectItem value="high">High (≥90%)</SelectItem>
															<SelectItem value="medium">Medium (75-89%)</SelectItem>
															<SelectItem value="low">Low (&lt;75%)</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Account</TableHead>
														<TableHead>Account ID</TableHead>
														<TableHead>Total</TableHead>
														<TableHead>Successful</TableHead>
														<TableHead>Failed</TableHead>
														<TableHead>Success Rate</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{filterAccountStats().map((account) => (
														<TableRow key={account.id}>
															<TableCell>{account.name}</TableCell>
															<TableCell>{account.accountId}</TableCell>
															<TableCell>{account.total}</TableCell>
															<TableCell>{account.successful}</TableCell>
															<TableCell>{account.failed}</TableCell>
															<TableCell>
																<div className="flex items-center">
																	<Progress value={account.successRate} className="h-2 w-24 mr-2" />
																	<span className={getSuccessRateColor(account.successRate)}>
                                    {account.successRate}%
                                  </span>
																</div>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</TabsContent>

										<TabsContent value="roles">
											<div className="flex justify-between items-center mb-4">
												<h3 className="text-lg font-medium">Role Success Rates</h3>
												<div className="flex gap-2">
													<div className="relative">
														<Input
															placeholder="Filter roles..."
															value={roleFilter}
															onChange={(e) => setRoleFilter(e.target.value)}
															className="w-[200px]"
														/>
														<Filter className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
													</div>
													<Select value={successRateFilter} onValueChange={setSuccessRateFilter}>
														<SelectTrigger className="w-[150px]">
															<SelectValue placeholder="Success Rate" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="">All Rates</SelectItem>
															<SelectItem value="high">High (≥90%)</SelectItem>
															<SelectItem value="medium">Medium (75-89%)</SelectItem>
															<SelectItem value="low">Low (&lt;75%)</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Role</TableHead>
														<TableHead>Total</TableHead>
														<TableHead>Successful</TableHead>
														<TableHead>Failed</TableHead>
														<TableHead>Success Rate</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{filterRoleStats().map((role) => (
														<TableRow key={role.id}>
															<TableCell>{role.name}</TableCell>
															<TableCell>{role.total}</TableCell>
															<TableCell>{role.successful}</TableCell>
															<TableCell>{role.failed}</TableCell>
															<TableCell>
																<div className="flex items-center">
																	<Progress value={role.successRate} className="h-2 w-24 mr-2" />
																	<span className={getSuccessRateColor(role.successRate)}>{role.successRate}%</span>
																</div>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</TabsContent>

										<TabsContent value="permissionSets">
											<div className="flex justify-between items-center mb-4">
												<h3 className="text-lg font-medium">Permission Set Success Rates</h3>
												<div className="flex gap-2">
													<div className="relative">
														<Input
															placeholder="Filter permission sets..."
															value={permissionSetFilter}
															onChange={(e) => setPermissionSetFilter(e.target.value)}
															className="w-[200px]"
														/>
														<Filter className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
													</div>
													<Select value={successRateFilter} onValueChange={setSuccessRateFilter}>
														<SelectTrigger className="w-[150px]">
															<SelectValue placeholder="Success Rate" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="">All Rates</SelectItem>
															<SelectItem value="high">High (≥90%)</SelectItem>
															<SelectItem value="medium">Medium (75-89%)</SelectItem>
															<SelectItem value="low">Low (&lt;75%)</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Permission Set</TableHead>
														<TableHead>Total</TableHead>
														<TableHead>Successful</TableHead>
														<TableHead>Failed</TableHead>
														<TableHead>Success Rate</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{filterPermissionSetStats().map((ps) => (
														<TableRow key={ps.id}>
															<TableCell>{ps.name}</TableCell>
															<TableCell>{ps.total}</TableCell>
															<TableCell>{ps.successful}</TableCell>
															<TableCell>{ps.failed}</TableCell>
															<TableCell>
																<div className="flex items-center">
																	<Progress value={ps.successRate} className="h-2 w-24 mr-2" />
																	<span className={getSuccessRateColor(ps.successRate)}>{ps.successRate}%</span>
																</div>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</TabsContent>

										<TabsContent value="trends">
											<h3 className="text-lg font-medium mb-4">Daily Deployment Trends</h3>
											<div className="space-y-6">
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead>Date</TableHead>
															<TableHead>Total</TableHead>
															<TableHead>Successful</TableHead>
															<TableHead>Failed</TableHead>
															<TableHead>Success Rate</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{reportData.dailyTrend.map((day) => (
															<TableRow key={day.date}>
																<TableCell>{day.date}</TableCell>
																<TableCell>{day.total}</TableCell>
																<TableCell>{day.successful}</TableCell>
																<TableCell>{day.failed}</TableCell>
																<TableCell className={getSuccessRateColor(day.successRate)}>
																	{day.successRate}%
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										</TabsContent>
									</Tabs>
								</div>
								<DialogFooter>
									<Button variant="outline" onClick={() => exportReportToCsv()} className="mr-2">
										<Download className="h-4 w-4 mr-2" />
										Export CSV
									</Button>
									<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
										Close
									</Button>
								</DialogFooter>
							</>
						)}
					</DialogContent>
				</Dialog>

				{/* Create report dialog */}
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Generate New Report</DialogTitle>
							<DialogDescription>Create a new deployment success report</DialogDescription>
						</DialogHeader>
						<div className="py-4 space-y-4">
							<div className="space-y-2">
								<Label htmlFor="report-name">Report Name</Label>
								<Input
									id="report-name"
									value={newReportName}
									onChange={(e) => setNewReportName(e.target.value)}
									placeholder="Weekly Deployment Report"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="report-period">Report Period</Label>
								<Select value={newReportPeriod} onValueChange={setNewReportPeriod}>
									<SelectTrigger id="report-period">
										<SelectValue placeholder="Select period" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="DAILY">Daily</SelectItem>
										<SelectItem value="WEEKLY">Weekly</SelectItem>
										<SelectItem value="MONTHLY">Monthly</SelectItem>
										<SelectItem value="CUSTOM">Custom</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{newReportPeriod === "CUSTOM" && (
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Start Date</Label>
										<DatePicker date={newReportStartDate} setDate={setNewReportStartDate} />
									</div>
									<div className="space-y-2">
										<Label>End Date</Label>
										<DatePicker date={newReportEndDate} setDate={setNewReportEndDate} />
									</div>
								</div>
							)}
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="mr-2">
								Cancel
							</Button>
							<Button onClick={handleCreateReport} disabled={!newReportName}>
								Generate Report
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Schedule report dialog */}
				<Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Schedule Recurring Report</DialogTitle>
							<DialogDescription>Set up automated reports delivered to your team</DialogDescription>
						</DialogHeader>
						<div className="py-4 space-y-4">
							<div className="space-y-2">
								<Label htmlFor="schedule-name">Report Name</Label>
								<Input
									id="schedule-name"
									value={scheduleReportName}
									onChange={(e) => setScheduleReportName(e.target.value)}
									placeholder="Weekly Compliance Report"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="schedule-period">Report Period</Label>
								<Select value={scheduleReportPeriod} onValueChange={setScheduleReportPeriod}>
									<SelectTrigger id="schedule-period">
										<SelectValue placeholder="Select period" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="DAILY">Daily</SelectItem>
										<SelectItem value="WEEKLY">Weekly</SelectItem>
										<SelectItem value="MONTHLY">Monthly</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="schedule-frequency">Delivery Frequency</Label>
								<Select value={scheduleReportFrequency} onValueChange={setScheduleReportFrequency}>
									<SelectTrigger id="schedule-frequency">
										<SelectValue placeholder="Select frequency" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="DAILY">Daily</SelectItem>
										<SelectItem value="WEEKLY">Weekly (Monday)</SelectItem>
										<SelectItem value="MONTHLY">Monthly (1st day)</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="schedule-recipients">Recipients (comma separated)</Label>
								<Input
									id="schedule-recipients"
									value={scheduleReportRecipients}
									onChange={(e) => setScheduleReportRecipients(e.target.value)}
									placeholder="user@example.com, admin@example.com"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)} className="mr-2">
								Cancel
							</Button>
							<Button onClick={handleScheduleReport} disabled={!scheduleReportName || !scheduleReportRecipients}>
								Schedule Report
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</CardContent>
		</Card>
	)
}

