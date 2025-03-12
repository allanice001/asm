import { DashboardHeader } from "@/components/dashboard-header";
import { PolicyManagement } from "@/components/policy-management";

export default function PoliciesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <PolicyManagement />
      </main>
    </div>
  );
}
