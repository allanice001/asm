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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Edit, Shield, FileText } from "lucide-react";

export default async function AccountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const accountId = params.id;

  const account = await prisma.awsAccount.findUnique({
    where: { id: accountId },
    include: {
      permissionSets: {
        include: {
          permissionSet: true,
        },
      },
      specificPolicies: {
        include: {
          policy: true,
        },
      },
    },
  });

  if (!account) {
    notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/accounts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounts
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{account.accountName}</h1>
          <p className="text-muted-foreground">
            Account ID: {account.accountId}
          </p>
        </div>
        <Link href={`/accounts/${account.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Account
          </Button>
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Account ID
              </h3>
              <p>{account.accountId}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Account Email
              </h3>
              <p>{account.accountEmail}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Organization ID
              </h3>
              <p>{account.organizationId || "Not specified"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Account Type
              </h3>
              <p>
                {account.isManagement ? (
                  <Badge variant="default">Management Account</Badge>
                ) : (
                  <Badge variant="outline">Member Account</Badge>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="permission-sets">
        <TabsList>
          <TabsTrigger value="permission-sets">Permission Sets</TabsTrigger>
          <TabsTrigger value="account-policies">
            Account-Specific Policies
          </TabsTrigger>
        </TabsList>
        <TabsContent value="permission-sets" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Permission Sets</h2>
            <Link href={`/accounts/${account.id}/permission-sets/assign`}>
              <Button>
                <Shield className="mr-2 h-4 w-4" />
                Assign Permission Sets
              </Button>
            </Link>
          </div>

          {account.permissionSets.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Permission Sets Assigned</CardTitle>
                <CardDescription>
                  This account doesn't have any permission sets assigned yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/accounts/${account.id}/permission-sets/assign`}>
                  <Button>Assign Permission Sets</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {account.permissionSets.map((item) => (
                <Card key={item.permissionSetId}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <CardTitle>{item.permissionSet.name}</CardTitle>
                    </div>
                    <CardDescription>
                      {item.permissionSet.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      <span className="font-medium">Session Duration:</span>{" "}
                      {item.permissionSet.sessionDuration}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <Link href={`/permission-sets/${item.permissionSetId}`}>
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
        </TabsContent>
        <TabsContent value="account-policies" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Account-Specific Policies</h2>
            <Link href={`/accounts/${account.id}/policies/create`}>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Create Account Policy
              </Button>
            </Link>
          </div>

          {account.specificPolicies.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Account-Specific Policies</CardTitle>
                <CardDescription>
                  This account doesn't have any account-specific policies yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/accounts/${account.id}/policies/create`}>
                  <Button>Create Account Policy</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {account.specificPolicies.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle>{item.policy.name}</CardTitle>
                    </div>
                    <CardDescription>
                      {item.policy.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-4 flex justify-end">
                      <Link
                        href={`/accounts/${account.id}/policies/${item.id}`}
                      >
                        <Button variant="outline" size="sm">
                          View Policy
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
