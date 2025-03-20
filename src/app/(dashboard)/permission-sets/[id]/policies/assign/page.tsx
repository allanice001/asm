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
import { ArrowLeft, FileText } from "lucide-react";

interface Policy {
  id: string;
  name: string;
  description: string | null;
  isAwsManaged: boolean;
  policyArn: string | null;
}

interface AssignPoliciesProps {
  params: { id: string };
}

export default function AssignPoliciesPage({ params }: AssignPoliciesProps) {
  const permissionSetId = params.id;
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [assignedPolicyIds, setAssignedPolicyIds] = useState<string[]>([]);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [permissionSet, setPermissionSet] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch permission set details
        const permissionSetResponse = await fetch(
          `/api/permission-sets/${permissionSetId}`,
        );
        if (!permissionSetResponse.ok) {
          throw new Error("Failed to fetch permission set");
        }
        const permissionSetData = await permissionSetResponse.json();
        setPermissionSet(permissionSetData);

        // Fetch all policies
        const policiesResponse = await fetch("/api/policies");
        if (!policiesResponse.ok) {
          throw new Error("Failed to fetch policies");
        }
        const policiesData = await policiesResponse.json();
        setPolicies(policiesData);

        // Fetch assigned policies for this permission set
        const assignedResponse = await fetch(
          `/api/permission-sets/${permissionSetId}/policies`,
        );
        if (!assignedResponse.ok) {
          throw new Error("Failed to fetch assigned policies");
        }
        const assignedData = await assignedResponse.json();
        const assignedIds = assignedData.map((item: any) => item.policyId);
        setAssignedPolicyIds(assignedIds);
        setSelectedPolicyIds(assignedIds);
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
  }, [permissionSetId, toast]);

  const handleTogglePolicy = (policyId: string) => {
    setSelectedPolicyIds((prev) =>
      prev.includes(policyId)
        ? prev.filter((id) => id !== policyId)
        : [...prev, policyId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/permission-sets/${permissionSetId}/policies`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            policyIds: selectedPolicyIds,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to assign policies");
      }

      toast({
        title: "Policies assigned",
        description:
          "The policies have been assigned to the permission set successfully.",
      });

      router.push(`/permission-sets/${permissionSetId}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to assign policies",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!permissionSet) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/permission-sets/${permissionSetId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Permission Set
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Assign Policies</h1>
      <p className="text-muted-foreground mb-6">
        Assign policies to {permissionSet.name} permission set
      </p>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Available Policies</CardTitle>
            <CardDescription>
              Select the policies you want to assign to this permission set.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {policies.length === 0 ? (
                <p>No policies available. Create policies first.</p>
              ) : (
                policies.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex items-start space-x-3 p-3 border rounded-md"
                  >
                    <Checkbox
                      id={`policy-${policy.id}`}
                      checked={selectedPolicyIds.includes(policy.id)}
                      onCheckedChange={() => handleTogglePolicy(policy.id)}
                    />
                    <div className="grid gap-1.5">
                      <label
                        htmlFor={`policy-${policy.id}`}
                        className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4 text-primary" />
                        {policy.name}
                        {assignedPolicyIds.includes(policy.id) && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Currently Assigned
                          </span>
                        )}
                      </label>
                      {policy.description && (
                        <p className="text-sm text-muted-foreground">
                          {policy.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {policy.isAwsManaged
                          ? `AWS Managed: ${policy.policyArn}`
                          : "Custom Policy"}
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
              onClick={() => router.push(`/permission-sets/${permissionSetId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || policies.length === 0}>
              {isLoading ? "Assigning..." : "Assign Policies"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
