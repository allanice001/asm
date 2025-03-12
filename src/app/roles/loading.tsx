import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function RolesLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              IAM Roles
            </CardTitle>
            <CardDescription>
              Manage custom IAM roles for your AWS accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-6">
              <div className="animate-pulse text-muted-foreground">
                Loading roles...
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
