import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Key } from "lucide-react";

export default function PermissionSetsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              SSO Permission Sets
            </CardTitle>
            <CardDescription>
              Manage AWS SSO permission sets for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-6">
              <div className="animate-pulse text-muted-foreground">
                Loading permission sets...
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
