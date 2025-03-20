import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Plus, Shield } from "lucide-react";
import Link from "next/link";

export default async function PermissionSetsPage() {
  const permissionSets = await prisma.permissionSet.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      policies: {
        include: {
          policy: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Permission Sets</h1>
        <Link href="/permission-sets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Permission Set
          </Button>
        </Link>
      </div>

      {permissionSets.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Permission Sets</CardTitle>
            <CardDescription>
              You haven&#39;t created any permission sets yet. Create your first
              permission set to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/permission-sets/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Permission Set
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {permissionSets.map((permissionSet) => (
            <Card key={permissionSet.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>{permissionSet.name}</CardTitle>
                </div>
                <CardDescription>
                  {permissionSet.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Session Duration:</span>{" "}
                    {permissionSet.sessionDuration}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Policies:</span>{" "}
                    {permissionSet.policies.length}
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href={`/permission-sets/${permissionSet.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
