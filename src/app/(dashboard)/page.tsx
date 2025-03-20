import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import {
  Shield,
  FileText,
  Server,
  Upload,
  ArrowRight,
  Users,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { DashboardMetricsChart } from "@/components/dashboard-metrics-chart";
import { DashboardActivityFeed } from "@/components/dashboard-activity-feed";

export default async function DashboardPage() {
  // Fetch counts from the database
  const accountsCount = await prisma.awsAccount.count();
  const permissionSetsCount = await prisma.permissionSet.count();
  const policiesCount = await prisma.policy.count();
  const deploymentsCount = await prisma.deployment.count();
  const usersCount = await prisma.user.count();

  // Fetch recent deployments
  const recentDeployments = await prisma.deployment.findMany({
    orderBy: {
      startedAt: "desc",
    },
    include: {
      user: true,
      account: true,
    },
    take: 5,
  });

  // Fetch recent audit logs
  const recentAuditLogs = await prisma.auditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
    },
    take: 5,
  });

  // Fetch accounts with most permission sets
  const accountsWithMostPermissionSets = await prisma.awsAccount.findMany({
    include: {
      _count: {
        select: {
          permissionSets: true,
        },
      },
    },
    orderBy: {
      permissionSets: {
        _count: "desc",
      },
    },
    take: 5,
  });

  // Fetch deployment stats for the chart
  const deploymentStats = await prisma.deployment.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
  });

  const deploymentData = deploymentStats.map((stat) => ({
    name: stat.status.charAt(0).toUpperCase() + stat.status.slice(1),
    value: stat._count.id,
  }));

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">AWS Accounts</CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/accounts" className="hover:underline">
                View all accounts
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Permission Sets
            </CardTitle>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissionSetsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/permission-sets" className="hover:underline">
                View all permission sets
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Policies</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policiesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/policies" className="hover:underline">
                View all policies
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Deployments</CardTitle>
            <Upload className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deploymentsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/deployments" className="hover:underline">
                View all deployments
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/users" className="hover:underline">
                View all users
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Accounts with the most permission sets</CardTitle>
            <CardContent>
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Id</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Account Email</TableHead>
                      <TableHead>Organization Id</TableHead>
                      <TableHead>Permission Sets</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountsWithMostPermissionSets.map((details) => (
                      <TableRow key={details.id}>
                        <TableCell>{details.accountId}</TableCell>
                        <TableCell>{details.accountName}</TableCell>
                        <TableCell>{details.accountEmail}</TableCell>
                        <TableCell>{details.organizationId}</TableCell>
                        <TableCell>{details._count.permissionSets}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Deployment Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <DashboardMetricsChart data={deploymentData} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDeployments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No deployments yet</p>
                <Link href="/deployments/new">
                  <Button size="sm">Start Your First Deployment</Button>
                </Link>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDeployments.map((deployment) => (
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
                          {new Date(deployment.startedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-right">
                  <Link href="/deployments">
                    <Button variant="ghost" size="sm">
                      View All Deployments
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAuditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No activity yet</p>
              </div>
            ) : (
              <DashboardActivityFeed auditLogs={recentAuditLogs} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
