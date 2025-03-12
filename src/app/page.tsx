import { DashboardHeader } from "@/components/dashboard-header";
import { AccountsOverview } from "@/components/accounts-overview";
import { RoleManagement } from "@/components/role-management";
import { PermissionSetManagement } from "@/components/permission-set-management";
import { DeploymentHistory } from "@/components/deployment-history";
import { PolicyManagement } from "@/components/policy-management";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <AccountsOverview />
          <div className="space-y-6">
            <PolicyManagement />
            <RoleManagement />
            <PermissionSetManagement />
          </div>
        </div>
        <div className="mt-6">
          <DeploymentHistory />
        </div>
      </main>
    </div>
  );
}
