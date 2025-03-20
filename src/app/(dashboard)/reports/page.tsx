"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { prisma } from "@/lib/prisma"
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from "recharts"

export default async function ReportsPage() {
	// Get permission sets per account
	const accountsWithPermissionSets = await prisma.awsAccount.findMany({
		include: {
			_count: {
				select: {
					permissionSets: true,
				},
			},
		},
		orderBy: {
			permissionSets: {
				_count: "desc",
			},
		},
		take: 10,
	})

	const permissionSetsPerAccount = accountsWithPermissionSets.map((account) => ({
		name: account.accountName,
		count: account._count.permissionSets,
	}))

	// Get policies per permission set
	const permissionSetsWithPolicies = await prisma.permissionSet.findMany({
		include: {
			_count: {
				select: {
					policies: true,
				},
			},
		},
		orderBy: {
			policies: {
				_count: "desc",
			},
		},
		take: 10,
	})

	const policiesPerPermissionSet = permissionSetsWithPolicies.map((permissionSet) => ({
		name: permissionSet.name,
		count: permissionSet._count.policies,
	}))

	// Get policy types distribution
	const policyStats = await prisma.policy.groupBy({
		by: ["isAwsManaged"],
		_count: {
			id: true,
		},
	})

	const policyTypes = [
		{ name: "AWS Managed", value: policyStats.find((stat) => stat.isAwsManaged)?._count.id || 0 },
		{ name: "Custom", value: policyStats.find((stat) => !stat.isAwsManaged)?._count.id || 0 },
	]

	// Get deployment stats
	const deploymentStats = await prisma.deployment.groupBy({
		by: ["status"],
		_count: {
			id: true,
		},
	})

	const deploymentStatuses = deploymentStats.map((stat) => ({
		name: stat.status.charAt(0).toUpperCase() + stat.status.slice(1),
		value: stat._count.id,
	}))

	const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

	return (
		<div className="container mx-auto">
			<h1 className="text-3xl font-bold mb-6">Reports</h1>

			<Tabs defaultValue="permission-sets">
				<TabsList className="mb-4">
					<TabsTrigger value="permission-sets">Permission Sets</TabsTrigger>
					<TabsTrigger value="policies">Policies</TabsTrigger>
					<TabsTrigger value="deployments">Deployments</TabsTrigger>
				</TabsList>

				<TabsContent value="permission-sets">
					<Card>
						<CardHeader>
							<CardTitle>Permission Sets per Account</CardTitle>
							<CardDescription>Top 10 accounts by number of permission sets</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-80">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={permissionSetsPerAccount} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
										<YAxis />
										<Tooltip />
										<Legend />
										<Bar dataKey="count" name="Permission Sets" fill="#8884d8" />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="policies">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>Policies per Permission Set</CardTitle>
								<CardDescription>Top 10 permission sets by number of policies</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="h-80">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={policiesPerPermissionSet} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
											<YAxis />
											<Tooltip />
											<Legend />
											<Bar dataKey="count" name="Policies" fill="#82ca9d" />
										</BarChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Policy Types Distribution</CardTitle>
								<CardDescription>AWS Managed vs Custom Policies</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="h-80">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={policyTypes}
												cx="50%"
												cy="50%"
												labelLine={true}
												label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
												outerRadius={80}
												fill="#8884d8"
												dataKey="value"
											>
												{policyTypes.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
												))}
											</Pie>
											<Tooltip />
											<Legend />
										</PieChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="deployments">
					<Card>
						<CardHeader>
							<CardTitle>Deployment Status Distribution</CardTitle>
							<CardDescription>Distribution of deployments by status</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-80">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={deploymentStatuses}
											cx="50%"
											cy="50%"
											labelLine={true}
											label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
											outerRadius={80}
											fill="#8884d8"
											dataKey="value"
										>
											{deploymentStatuses.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
											))}
										</Pie>
										<Tooltip />
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}

