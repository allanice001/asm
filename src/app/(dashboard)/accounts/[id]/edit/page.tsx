"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft } from "lucide-react";

interface EditAccountProps {
  params: { id: string };
}

export default function EditAccountPage({ params }: EditAccountProps) {
  const accountId = params.id;
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountId: "",
    accountName: "",
    accountEmail: "",
    organizationId: "",
    isManagement: false,
  });

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const response = await fetch(`/api/accounts/${accountId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch account");
        }
        const data = await response.json();
        setFormData({
          accountId: data.accountId,
          accountName: data.accountName,
          accountEmail: data.accountEmail,
          organizationId: data.organizationId || "",
          isManagement: data.isManagement,
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to fetch account",
          variant: "destructive",
        });
      }
    };

    fetchAccount();
  }, [accountId, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update account");
      }

      toast({
        title: "Account updated",
        description: "The AWS account has been updated successfully.",
      });

      router.push(`/accounts/${accountId}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/accounts/${accountId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Account
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Edit AWS Account</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Update the details of this AWS account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountId">Account ID</Label>
              <Input
                id="accountId"
                name="accountId"
                value={formData.accountId}
                onChange={handleChange}
                required
                maxLength={12}
                minLength={12}
                disabled
              />
              <p className="text-sm text-muted-foreground">
                The 12-digit AWS account ID (cannot be changed)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountEmail">Account Email</Label>
              <Input
                id="accountEmail"
                name="accountEmail"
                type="email"
                value={formData.accountEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationId">Organization ID</Label>
              <Input
                id="organizationId"
                name="organizationId"
                value={formData.organizationId}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                Optional: The AWS Organization ID this account belongs to
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isManagement"
                name="isManagement"
                checked={formData.isManagement}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    isManagement: checked as boolean,
                  })
                }
              />
              <Label htmlFor="isManagement">This is a management account</Label>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Account"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
