import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { DeleteUserButton } from "@/components/delete-user-button";

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = params.id;
  const currentUser = await getCurrentUser();
  const isUserAdmin = await isAdmin();

  if (!currentUser) {
    redirect("/auth/signin");
  }

  // Only admins can view other users
  if (currentUser.id !== userId && !isUserAdmin) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    notFound();
  }

  // Get user's recent activity
  const auditLogs = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        {isUserAdmin && (
          <Link href="/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {(isUserAdmin || currentUser.id === user.id) && (
            <Link href={`/users/${user.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          )}
          {isUserAdmin && currentUser.id !== user.id && (
            <DeleteUserButton userId={user.id} userName={user.name} />
          )}
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Name
              </h3>
              <p>{user.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Email
              </h3>
              <p>{user.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Role
              </h3>
              <p>
                <Badge variant={user.role === "admin" ? "default" : "outline"}>
                  {user.role}
                </Badge>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Member Since
              </h3>
              <p>{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {auditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {auditLogs.map((log) => (
                <li key={log.id} className="border-b pb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {log.action.charAt(0).toUpperCase() + log.action.slice(1)}{" "}
                      {log.resourceType}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Resource ID: {log.resourceId}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
