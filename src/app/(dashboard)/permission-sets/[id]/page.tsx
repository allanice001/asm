import { notFound } from "next/navigation";
import Link from "next/link";
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
import { ArrowLeft, Edit, FileText, Server } from "lucide-react";

export default async function PermissionSetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const permissionSetId = params.id;

  const permissionSet = await prisma.permissionSet.findUnique({
    where: { id: permissionSetId },
    include: {
      policies: {
        include: {
          policy: true,
        },
      },
      accounts: {
        include: {
          account: true,
        },
      },
    },
  });

  if (!permissionSet) {
    notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/permission-sets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Permission Sets
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{permissionSet.name}</h1>
          {permissionSet.description && (
            <p className="text-muted-foreground">{permissionSet.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/permission-sets/${permissionSet.id}/policies/assign`}>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Assign Policies
            </Button>
          </Link>
          <Link href={`/permission-sets/${permissionSet.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Permission Set Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Name
              </h3>
              <p>{permissionSet.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Session Duration
              </h3>
              <p>{permissionSet.sessionDuration}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Relay State
              </h3>
              <p>{permissionSet.relayState || "Not specified"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Created At
              </h3>
              <p>{new Date(permissionSet.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assigned Policies</CardTitle>
              <Link
                href={`/permission-sets/${permissionSet.id}/policies/assign`}
              >
                <Button variant="outline" size="sm">
                  Manage Policies
                </Button>
              </Link>
            </div>
            <CardDescription>
              Policies attached to this permission set
            </CardDescription>
          </CardHeader>
          <CardContent>
            {permissionSet.policies.length === 0 ? (
              <p className="text-muted-foreground">
                No policies assigned to this permission set.
              </p>
            ) : (
              <div className="space-y-3">
                {permissionSet.policies.map((item) => (
                  <div
                    key={item.policyId}
                    className="flex items-start space-x-3 p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium">{item.policy.name}</span>
                      </div>
                      {item.policy.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.policy.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {item.policy.isAwsManaged && (
                          <Badge variant="secondary">AWS Managed</Badge>
                        )}
                        {item.policy.isAccountSpecific && (
                          <Badge variant="outline">Account Specific</Badge>
                        )}
                      </div>
                    </div>
                    <Link href={`/policies/${item.policy.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Accounts</CardTitle>
            <CardDescription>
              AWS accounts using this permission set
            </CardDescription>
          </CardHeader>
          <CardContent>
            {permissionSet.accounts.length === 0 ? (
              <p className="text-muted-foreground">
                No accounts are using this permission set.
              </p>
            ) : (
              <div className="space-y-3">
                {permissionSet.accounts.map((item) => (
                  <div
                    key={item.accountId}
                    className="flex items-start space-x-3 p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {item.account.accountName}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Account ID: {item.account.accountId}
                      </p>
                    </div>
                    <Link href={`/accounts/${item.account.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
