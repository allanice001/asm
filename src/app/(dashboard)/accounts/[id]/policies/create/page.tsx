"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface Policy {
  id: number;
  name: string;
  description: string | null;
  accountSpecific: boolean;
}

interface CreateAccountPolicyProps {
  params: { id: string };
}

export default function CreateAccountPolicyPage({
  params,
}: CreateAccountPolicyProps) {
  const accountId = params.id;
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accountSpecificPolicies, setAccountSpecificPolicies] = useState<
    Policy[]
  >([]);
  const [account, setAccount] = useState<{
    id: number;
    accountName: string;
  } | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [policyDocument, setPolicyDocument] = useState<string>(
    JSON.stringify(
      {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
            Resource: [
              "arn:aws:s3:::ACCOUNT-SPECIFIC-BUCKET",
              "arn:aws:s3:::ACCOUNT-SPECIFIC-BUCKET/*",
            ],
          },
        ],
      },
      null,
      2,
    ),
  );

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

        // Fetch account-specific policies
        const policiesResponse = await fetch(
          "/api/policies?isAccountSpecific=true",
        );
        if (!policiesResponse.ok) {
          throw new Error("Failed to fetch policies");
        }
        const policiesData = await policiesResponse.json();
        setAccountSpecificPolicies(policiesData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate JSON policy document
      try {
        JSON.parse(policyDocument);
      } catch (error) {
        throw new Error("Invalid JSON in policy document");
      }

      const response = await fetch(`/api/accounts/${accountId}/policies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policyId: Number.parseInt(selectedPolicyId),
          policyDocument: JSON.parse(policyDocument),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Failed to create account-specific policy",
        );
      }

      toast({
        title: "Policy created",
        description:
          "The account-specific policy has been created successfully.",
      });

      router.push(`/accounts/${accountId}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create account-specific policy",
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

      <h1 className="text-3xl font-bold mb-2">
        Create Account-Specific Policy
      </h1>
      <p className="text-muted-foreground mb-6">
        Create an account-specific policy for {account.accountName}
      </p>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Policy Details</CardTitle>
            <CardDescription>
              Select a policy template and customize it for this account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accountSpecificPolicies.length === 0 ? (
              <div className="p-4 border rounded-md bg-muted">
                <p className="mb-2">
                  No account-specific policy templates available.
                </p>
                <Link href="/policies/new">
                  <Button variant="outline" size="sm">
                    Create Policy Template
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="policyId">Policy Template</Label>
                  <Select
                    value={selectedPolicyId}
                    onValueChange={setSelectedPolicyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a policy template" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountSpecificPolicies.map((policy) => (
                        <SelectItem
                          key={policy.id}
                          value={policy.id.toString()}
                        >
                          {policy.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policyDocument">Policy Document</Label>
                  <Textarea
                    id="policyDocument"
                    value={policyDocument}
                    onChange={(e) => setPolicyDocument(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Customize the JSON policy document for this account
                  </p>
                </div>
              </>
            )}
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
              disabled={
                isLoading ||
                accountSpecificPolicies.length === 0 ||
                !selectedPolicyId
              }
            >
              {isLoading ? "Creating..." : "Create Account-Specific Policy"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
