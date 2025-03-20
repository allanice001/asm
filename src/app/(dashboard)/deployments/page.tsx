import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { Upload, Play } from "lucide-react";
import Link from "next/link";

export default async function DeploymentsPage() {
  const deployments = await prisma.deployment.findMany({
    orderBy: {
      startedAt: "desc",
    },
    include: {
      user: true,
      account: true,
    },
    take: 10,
  });

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Deployments</h1>
        <Link href="/deployments/new">
          <Button>
            <Play className="mr-2 h-4 w-4" />
            New Deployment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Deployments</CardTitle>
          <CardDescription>
            View and manage your recent deployments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deployments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No deployments yet</p>
              <Link href="/deployments/new" className="mt-4">
                <Button>Start Your First Deployment</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deployments.map((deployment) => (
                  <TableRow key={deployment.id}>
                    <TableCell>{deployment.account.accountName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          deployment.status === "completed"
                            ? "success"
                            : deployment.status === "failed"
                              ? "destructive"
                              : "default"
                        }
                      >
                        {deployment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(deployment.startedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {deployment.completedAt
                        ? new Date(deployment.completedAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>{deployment.user.name}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/deployments/${deployment.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
