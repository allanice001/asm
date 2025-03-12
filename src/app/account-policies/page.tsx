import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { AccountRolePolicyManagement } from "@/components/account-role-policy-management"

export default async function AccountPoliciesPage() {
	const session = await getSession()

	if (!session) {
		redirect("/login")
	}

	return (
		<div className="flex min-h-screen flex-col">
			<DashboardHeader />
			<main className="flex-1 container mx-auto py-6 px-4 md:px-6">
				<div className="space-y-6">
					<AccountRolePolicyManagement />
				</div>
			</main>
		</div>
	)
}

