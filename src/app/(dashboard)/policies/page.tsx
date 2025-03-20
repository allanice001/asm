import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";

export default async function PoliciesPage() {
  const policies = await prisma.policy.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Policies</h1>
        <Link href="/policies/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Button>
        </Link>
      </div>

      {policies.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Policies</CardTitle>
            <CardDescription>
              You haven&#39;t created any policies yet. Create your first policy
              to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/policies/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Policy
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {policies.map((policy) => (
            <Card key={policy.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>{policy.name}</CardTitle>
                </div>
                <CardDescription>
                  {policy.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {policy.isAwsManaged && (
                    <Badge variant="secondary">AWS Managed</Badge>
                  )}
                  {policy.isAccountSpecific && (
                    <Badge variant="outline">Account Specific</Badge>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href={`/policies/${policy.id}`}>
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
