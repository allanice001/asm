"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Key, AlertCircle, CheckCircle } from "lucide-react";

export function AwsCredentialsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<
    "none" | "valid" | "invalid"
  >("none");
  const [formData, setFormData] = useState({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: "",
    region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await fetch("/api/settings/aws-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save AWS credentials");
      }

      toast({
        title: "Credentials saved",
        description: "AWS credentials have been saved successfully.",
      });

      // Test the credentials after saving
      testCredentials();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save AWS credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testCredentials = async () => {
    setIsTestingCredentials(true);
    setCredentialStatus("none");

    try {
      const response = await fetch("/api/settings/aws-credentials/test");

      if (!response.ok) {
        setCredentialStatus("invalid");
        return;
      }

      const data = await response.json();

      if (data.valid) {
        setCredentialStatus("valid");
        toast({
          title: "Credentials valid",
          description: "Your AWS credentials are valid.",
        });
      } else {
        setCredentialStatus("invalid");
        toast({
          title: "Credentials invalid",
          description: data.message || "Your AWS credentials are invalid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setCredentialStatus("invalid");
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to test AWS credentials",
        variant: "destructive",
      });
    } finally {
      setIsTestingCredentials(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AWS Credentials</CardTitle>
        <CardDescription>
          Configure your AWS credentials for accessing AWS resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessKeyId">AWS Access Key ID</Label>
            <Input
              id="accessKeyId"
              name="accessKeyId"
              value={formData.accessKeyId}
              onChange={handleChange}
              required
              placeholder="AKIAIOSFODNN7EXAMPLE"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretAccessKey">AWS Secret Access Key</Label>
            <Input
              id="secretAccessKey"
              name="secretAccessKey"
              type="password"
              value={formData.secretAccessKey}
              onChange={handleChange}
              required
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">AWS Region</Label>
            <Input
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
              placeholder="us-east-1"
            />
          </div>

          {credentialStatus === "valid" && (
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-800 dark:text-green-300">
                Valid Credentials
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                Your AWS credentials are valid and working correctly.
              </AlertDescription>
            </Alert>
          )}

          {credentialStatus === "invalid" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid Credentials</AlertTitle>
              <AlertDescription>
                Your AWS credentials are invalid or don&#39;t have the necessary
                permissions.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={testCredentials}
              disabled={isTestingCredentials}
            >
              {isTestingCredentials ? "Testing..." : "Test Credentials"}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Credentials"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start">
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-center">
            <Key className="h-4 w-4 mr-2" />
            Your credentials are securely stored as environment variables.
          </p>
          <p>
            For production use, we recommend using IAM roles or AWS SSO instead
            of long-term access keys.
          </p>
          <p className="text-amber-600 dark:text-amber-400 mt-2">
            Note: Your access keys are stored server-side and never exposed to
            the browser.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
