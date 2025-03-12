import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard-header";
import { DeploymentHistory } from "@/components/deployment-history";
import {DeploymentReports} from "@/components/deployment-reports";

export default async function DeploymentsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <div className="space-y-6">
          <DeploymentHistory />
          <DeploymentReports />

        </div>
      </main>
    </div>
  );
}
