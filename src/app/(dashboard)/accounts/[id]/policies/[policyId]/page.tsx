import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Edit } from "lucide-react";
import { DeleteAccountPolicyButton } from "@/components/delete-account-policy-button";

export default async function AccountPolicyDetailPage({
  params,
}: {
  params: { id: string; policyId: string };
}) {
  const accountId = params.id;
  const policyId = params.policyId;

  const accountPolicy = await prisma.accountSpecificPolicy.findUnique({
    where: { id: policyId },
    include: {
      account: true,
      policy: true,
    },
  });

  if (!accountPolicy || accountPolicy.accountId !== accountId) {
    notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/accounts/${accountId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Account
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{accountPolicy.policy.name}</h1>
          <p className="text-muted-foreground">
            Account-specific policy for {accountPolicy.account.accountName}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/accounts/${accountId}/policies/${policyId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeleteAccountPolicyButton
            accountId={accountId}
            policyId={policyId}
            policyName={accountPolicy.policy.name}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="outline">Account Specific</Badge>
        {accountPolicy.policy.isAwsManaged && (
          <Badge variant="secondary">AWS Managed</Badge>
        )}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Policy Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Policy Name
              </h3>
              <p>{accountPolicy.policy.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Account
              </h3>
              <p>
                {accountPolicy.account.accountName} (
                {accountPolicy.account.accountId})
              </p>
            </div>
            {accountPolicy.policy.description && (
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Description
                </h3>
                <p>{accountPolicy.policy.description}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Created At
              </h3>
              <p>{new Date(accountPolicy.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Last Updated
              </h3>
              <p>{new Date(accountPolicy.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Policy Document
            </h3>
            <pre className="p-4 bg-muted rounded-md overflow-auto max-h-96 text-sm">
              {JSON.stringify(accountPolicy.policyDocument, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
