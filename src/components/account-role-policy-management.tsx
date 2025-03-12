"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Account = {
	id: string
	name: string
}

type Role = {
	id: string
	name: string
}

type Policy = {
	id: string
	name: string
	description: string | null
}

type AccountRolePolicyAssignment = {
	id: string
	accountId: string
	roleId: string
	policyId: string
	policy: Policy
}

export function AccountRolePolicyManagement() {
	const [accounts, setAccounts] = useState<Account[]>([])
	const [roles, setRoles] = useState<Role[]>([])
	const [policies, setPolicies] = useState<Policy[]>([])
	const [assignments, setAssignments] = useState<AccountRolePolicyAssignment[]>([])
	const [globalPolicies, setGlobalPolicies] = useState<Policy[]>([])

	const [selectedAccountId, setSelectedAccountId] = useState<string>("")
	const [selectedRoleId, setSelectedRoleId] = useState<string>("")
	const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([])
	const [overrideGlobal, setOverrideGlobal] = useState<boolean>(false)

	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	// Fetch accounts, roles, and policies
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true)
			try {
				// Fetch accounts
				const accountsResponse = await fetch("/api/accounts")
				const accountsData = await accountsResponse.json()
				setAccounts(accountsData.accounts || [])

				// Fetch roles
				const rolesResponse = await fetch("/api/roles")
				const rolesData = await rolesResponse.json()
				setRoles(rolesData.roles || [])

				// Fetch policies
				const policiesResponse = await fetch("/api/policies")
				const policiesData = await policiesResponse.json()
				setPolicies(policiesData.policies || [])
			} catch (error) {
				console.error("Error fetching data:", error)
				setError("Failed to load data. Please try again.")
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [])

	// Fetch assignments when account and role are selected
	useEffect(() => {
		if (selectedAccountId && selectedRoleId) {
			fetchAssignments(selectedAccountId, selectedRoleId)
		}
	}, [selectedAccountId, selectedRoleId])

	const fetchAssignments = async (accountId: string, roleId: string) => {
		try {
			const response = await fetch(`/api/accounts/${accountId}/roles/${roleId}/policies`)
			const data = await response.json()

			if (response.ok) {
				setAssignments(data.accountSpecificPolicies || [])
				setGlobalPolicies(data.globalPolicies || [])
				setSelectedPolicyIds(data.accountSpecificPolicies.map((p: Policy) => p.id))
			} else {
				setError(data.error || "Failed to fetch policy assignments")
			}
		} catch (error) {
			console.error("Error fetching assignments:", error)
			setError("Failed to fetch policy assignments. Please try again.")
		}
	}

	const handleSaveAssignments = async () => {
		setError(null)
		setSuccess(null)

		if (!selectedAccountId || !selectedRoleId) {
			setError("Please select an account and role")
			return
		}

		try {
			const response = await fetch(`/api/accounts/${selectedAccountId}/roles/${selectedRoleId}/policies`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					policyIds: selectedPolicyIds,
					overrideGlobal,
				}),
			})

			const data = await response.json()

			if (response.ok) {
				setSuccess("Policy assignments updated successfully")
				setIsDialogOpen(false)

				// Refresh assignments
				fetchAssignments(selectedAccountId, selectedRoleId)
			} else {
				setError(data.error || "Failed to update policy assignments")
			}
		} catch (error) {
			console.error("Error saving assignments:", error)
			setError("Failed to save policy assignments. Please try again.")
		}
	}

	const handlePolicyChange = (policyId: string, checked: boolean) => {
		if (checked) {
			setSelectedPolicyIds([...selectedPolicyIds, policyId])
		} else {
			setSelectedPolicyIds(selectedPolicyIds.filter((id) => id !== policyId))
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Link className="h-5 w-5" />
					Account-Specific Role Policies
				</CardTitle>
				<CardDescription>Manage policy assignments for roles in specific accounts</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="flex justify-center py-6">
						<div className="animate-pulse text-muted-foreground">Loading data...</div>
					</div>
				) : (
					<div className="space-y-6">
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{success && (
							<Alert className="bg-green-50 border-green-500">
								<AlertDescription className="text-green-700">{success}</AlertDescription>
							</Alert>
						)}

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<Label htmlFor="account">Select Account</Label>
								<Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
									<SelectTrigger id="account">
										<SelectValue placeholder="Select an account" />
									</SelectTrigger>
									<SelectContent>
										{accounts.map((account) => (
											<SelectItem key={account.id} value={account.id}>
												{account.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label htmlFor="role">Select Role</Label>
								<Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
									<SelectTrigger id="role">
										<SelectValue placeholder="Select a role" />
									</SelectTrigger>
									<SelectContent>
										{roles.map((role) => (
											<SelectItem key={role.id} value={role.id}>
												{role.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{selectedAccountId && selectedRoleId && (
							<div className="border rounded-md p-4">
								<div className="flex justify-between items-center mb-4">
									<h3 className="text-lg font-medium">Policy Assignments</h3>
									<Button onClick={() => setIsDialogOpen(true)}>Manage Policies</Button>
								</div>

								<Tabs defaultValue="account-specific">
									<TabsList>
										<TabsTrigger value="account-specific">Account-Specific Policies</TabsTrigger>
										<TabsTrigger value="global">Global Role Policies</TabsTrigger>
									</TabsList>

									<TabsContent value="account-specific">
										{assignments.length === 0 ? (
											<div className="text-center py-6 text-muted-foreground">
												No account-specific policies assigned to this role.
											</div>
										) : (
											<div className="space-y-2 mt-4">
												{assignments.map((assignment) => {
													const policy = policies.find((p) => p.id === assignment.policyId)
													return policy ? (
														<div
															key={assignment.id}
															className="flex items-center justify-between border p-3 rounded-md"
														>
															<div>
																<div className="font-medium">{policy.name}</div>
																<div className="text-sm text-muted-foreground">{policy.description}</div>
															</div>
															<Badge>Account-Specific</Badge>
														</div>
													) : null
												})}
											</div>
										)}
									</TabsContent>

									<TabsContent value="global">
										{globalPolicies.length === 0 ? (
											<div className="text-center py-6 text-muted-foreground">
												No global policies assigned to this role.
											</div>
										) : (
											<div className="space-y-2 mt-4">
												{globalPolicies.map((policy) => (
													<div key={policy.id} className="flex items-center justify-between border p-3 rounded-md">
														<div>
															<div className="font-medium">{policy.name}</div>
															<div className="text-sm text-muted-foreground">{policy.description}</div>
														</div>
														<Badge variant="outline">Global</Badge>
													</div>
												))}
											</div>
										)}
									</TabsContent>
								</Tabs>
							</div>
						)}
					</div>
				)}

				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Manage Account-Specific Policies</DialogTitle>
							<DialogDescription>Select policies to assign to this role in this specific account.</DialogDescription>
						</DialogHeader>

						<div className="py-4">
							<div className="space-y-4">
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="override-global"
										checked={overrideGlobal}
										onChange={(e) => setOverrideGlobal(e.target.checked)}
										className="h-4 w-4 rounded border-gray-300"
									/>
									<Label htmlFor="override-global" className="text-sm font-normal">
										Override global policies (use only account-specific policies)
									</Label>
								</div>

								<div className="border-t pt-4">
									<Label className="text-base mb-2 block">Select Policies</Label>
									<div className="max-h-[300px] overflow-y-auto space-y-2">
										{policies.map((policy) => (
											<div key={policy.id} className="flex items-center space-x-2">
												<input
													type="checkbox"
													id={`policy-${policy.id}`}
													checked={selectedPolicyIds.includes(policy.id)}
													onChange={(e) => handlePolicyChange(policy.id, e.target.checked)}
													className="h-4 w-4 rounded border-gray-300"
												/>
												<Label htmlFor={`policy-${policy.id}`} className="text-sm font-normal">
													{policy.name}
												</Label>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleSaveAssignments}>Save Assignments</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</CardContent>
			<CardFooter>
				<div className="text-sm text-muted-foreground">
					Account-specific policies allow you to customize policy assignments for the same role across different
					accounts.
				</div>
			</CardFooter>
		</Card>
	)
}

