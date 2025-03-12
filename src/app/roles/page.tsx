import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { RoleManagement } from "@/components/role-management";
import { getSession } from "@/lib/auth";

export default async function RolesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <div className="space-y-6">
          <RoleManagement />
        </div>
      </main>
    </div>
  );
}
