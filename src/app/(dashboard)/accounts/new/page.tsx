"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NewAccountPage() {
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
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create account");
      }

      toast({
        title: "Account created",
        description: "The AWS account has been added successfully.",
      });

      router.push("/accounts");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Add AWS Account</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Enter the details of the AWS account you want to add.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountId">Account ID</Label>
              <Input
                id="accountId"
                name="accountId"
                placeholder="123456789012"
                value={formData.accountId}
                onChange={handleChange}
                required
                maxLength={12}
                minLength={12}
              />
              <p className="text-sm text-muted-foreground">
                The 12-digit AWS account ID
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                name="accountName"
                placeholder="Production"
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
                placeholder="aws@example.com"
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
                placeholder="o-abcdefghij"
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
              onClick={() => router.push("/accounts")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Account"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
