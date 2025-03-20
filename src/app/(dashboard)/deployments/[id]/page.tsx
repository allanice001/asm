import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";

export default async function DeploymentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const deploymentId = params.id;

  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      user: true,
      account: true,
    },
  });

  if (!deployment) {
    notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/deployments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deployments
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Deployment Details</h1>
          <p className="text-muted-foreground">
            Deployment to {deployment.account.accountName}
          </p>
        </div>
        <Badge
          variant={
            deployment.status === "completed"
              ? "success"
              : deployment.status === "failed"
                ? "destructive"
                : "default"
          }
          className="text-sm px-3 py-1"
        >
          {deployment.status.charAt(0).toUpperCase() +
            deployment.status.slice(1)}
        </Badge>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Deployment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Account
              </h3>
              <p>
                {deployment.account.accountName} ({deployment.account.accountId}
                )
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Initiated By
              </h3>
              <p>{deployment.user.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Started At
              </h3>
              <p>{new Date(deployment.startedAt).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Completed At
              </h3>
              <p>
                {deployment.completedAt
                  ? new Date(deployment.completedAt).toLocaleString()
                  : "In progress..."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deployment Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-md overflow-auto max-h-96 text-sm">
            {deployment.logOutput || "No logs available"}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
