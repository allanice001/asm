"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield } from "lucide-react";

interface PermissionSet {
  id: number;
  name: string;
  description: string | null;
  sessionDuration: string;
}

interface AssignPermissionSetsProps {
  params: { id: string };
}

export default function AssignPermissionSetsPage({
  params,
}: AssignPermissionSetsProps) {
  const accountId = params.id;
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [permissionSets, setPermissionSets] = useState<PermissionSet[]>([]);
  const [assignedPermissionSetIds, setAssignedPermissionSetIds] = useState<
    number[]
  >([]);
  const [selectedPermissionSetIds, setSelectedPermissionSetIds] = useState<
    number[]
  >([]);
  const [account, setAccount] = useState<{
    id: number;
    accountName: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch account details
        const accountResponse = await fetch(`/api/accounts/${accountId}`);
        if (!accountResponse.ok) {
          throw new Error("Failed to fetch account");
        }
        const accountData = await accountResponse.json();
        setAccount(accountData);

        // Fetch all permission sets
        const permissionSetsResponse = await fetch("/api/permission-sets");
        if (!permissionSetsResponse.ok) {
          throw new Error("Failed to fetch permission sets");
        }
        const permissionSetsData = await permissionSetsResponse.json();
        setPermissionSets(permissionSetsData);

        // Fetch assigned permission sets for this account
        const assignedResponse = await fetch(
          `/api/accounts/${accountId}/permission-sets`,
        );
        if (!assignedResponse.ok) {
          throw new Error("Failed to fetch assigned permission sets");
        }
        const assignedData = await assignedResponse.json();
        const assignedIds = assignedData.map(
          (item: any) => item.permissionSetId,
        );
        setAssignedPermissionSetIds(assignedIds);
        setSelectedPermissionSetIds(assignedIds);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to fetch data",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [accountId, toast]);

  const handleTogglePermissionSet = (permissionSetId: number) => {
    setSelectedPermissionSetIds((prev) =>
      prev.includes(permissionSetId)
        ? prev.filter((id) => id !== permissionSetId)
        : [...prev, permissionSetId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/accounts/${accountId}/permission-sets`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permissionSetIds: selectedPermissionSetIds,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to assign permission sets");
      }

      toast({
        title: "Permission sets assigned",
        description:
          "The permission sets have been assigned to the account successfully.",
      });

      router.push(`/accounts/${accountId}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to assign permission sets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/accounts/${accountId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Account
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Assign Permission Sets</h1>
      <p className="text-muted-foreground mb-6">
        Assign permission sets to {account.accountName}
      </p>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Available Permission Sets</CardTitle>
            <CardDescription>
              Select the permission sets you want to assign to this account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {permissionSets.length === 0 ? (
                <p>
                  No permission sets available. Create permission sets first.
                </p>
              ) : (
                permissionSets.map((permissionSet) => (
                  <div
                    key={permissionSet.id}
                    className="flex items-start space-x-3 p-3 border rounded-md"
                  >
                    <Checkbox
                      id={`permission-set-${permissionSet.id}`}
                      checked={selectedPermissionSetIds.includes(
                        permissionSet.id,
                      )}
                      onCheckedChange={() =>
                        handleTogglePermissionSet(permissionSet.id)
                      }
                    />
                    <div className="grid gap-1.5">
                      <label
                        htmlFor={`permission-set-${permissionSet.id}`}
                        className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <Shield className="h-4 w-4 text-primary" />
                        {permissionSet.name}
                        {assignedPermissionSetIds.includes(
                          permissionSet.id,
                        ) && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Currently Assigned
                          </span>
                        )}
                      </label>
                      {permissionSet.description && (
                        <p className="text-sm text-muted-foreground">
                          {permissionSet.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Session Duration: {permissionSet.sessionDuration}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/accounts/${accountId}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || permissionSets.length === 0}
            >
              {isLoading ? "Assigning..." : "Assign Permission Sets"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
