import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Rocket } from "lucide-react";

export default function DeploymentsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Deployment History
            </CardTitle>
            <CardDescription>
              Track and manage deployments to your AWS accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-6">
              <div className="animate-pulse text-muted-foreground">
                Loading deployments...
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
