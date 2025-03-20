import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function AccountsPage() {
  const accounts = await prisma.awsAccount.findMany({
    orderBy: {
      accountName: "asc",
    },
  });

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">AWS Accounts</h1>
        <Link href="/accounts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </Link>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No AWS Accounts</CardTitle>
            <CardDescription>
              You haven&#39;t added any AWS accounts yet. Add your first account
              to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/accounts/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <CardTitle>{account.accountName}</CardTitle>
                <CardDescription>{account.accountId}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {account.isManagement ? (
                    <Badge variant={"default"}>Management Account</Badge>
                  ) : (
                    <Badge variant={"secondary"}>Member Account</Badge>
                  )}
                </p>
                <div className="mt-4 flex justify-end">
                  <Link href={`/accounts/${account.id}`}>
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
