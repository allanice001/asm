"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function NewPermissionSetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sessionDuration: "PT8H",
    relayState: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/permission-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create permission set");
      }

      toast({
        title: "Permission set created",
        description: "The permission set has been created successfully.",
      });

      router.push("/permission-sets");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create permission set",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create Permission Set</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Permission Set Details</CardTitle>
            <CardDescription>
              Enter the details of the permission set you want to create.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="AdministratorAccess"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Provides full access to AWS services and resources"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionDuration">Session Duration</Label>
              <Input
                id="sessionDuration"
                name="sessionDuration"
                placeholder="PT8H"
                value={formData.sessionDuration}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                ISO 8601 duration format (e.g., PT8H for 8 hours, PT1H30M for 1
                hour and 30 minutes)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relayState">Relay State (Optional)</Label>
              <Input
                id="relayState"
                name="relayState"
                placeholder="https://console.aws.amazon.com/ec2/"
                value={formData.relayState}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                The URL to which users are redirected after successful
                authentication
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/permission-sets")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Permission Set"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
