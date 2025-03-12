import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard-header";
import { PermissionSetManagement } from "@/components/permission-set-management";

export default async function PermissionSetsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <div className="space-y-6">
          <PermissionSetManagement />
        </div>
      </main>
    </div>
  );
}
