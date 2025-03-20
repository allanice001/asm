"use client";

import type React from "react";

import { useState, useEffect } from "react";
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

export function AwsProfileForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<
    "none" | "valid" | "invalid"
  >("none");
  const [formData, setFormData] = useState({
    profile: process.env.NEXT_PUBLIC_AWS_PROFILE || "default",
    region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  });

  useEffect(() => {
    // Fetch current profile settings
    const fetchProfileSettings = async () => {
      try {
        const response = await fetch("/api/settings/aws-profile");
        if (response.ok) {
          const data = await response.json();
          setFormData({
            profile: data.profile || "default",
            region: data.region || "us-east-1",
          });
        }
      } catch (error) {
        console.error("Error fetching AWS profile settings:", error);
      }
    };

    fetchProfileSettings();
  }, []);

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
      const response = await fetch("/api/settings/aws-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save AWS profile settings");
      }

      toast({
        title: "Profile settings saved",
        description: "AWS profile settings have been saved successfully.",
      });

      // Test the credentials after saving
      testCredentials();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save AWS profile settings",
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
        <CardTitle>AWS Profile</CardTitle>
        <CardDescription>
          Configure your AWS profile for accessing AWS resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile">AWS Profile Name</Label>
            <Input
              id="profile"
              name="profile"
              value={formData.profile}
              onChange={handleChange}
              required
              placeholder="default"
            />
            <p className="text-sm text-muted-foreground">
              The name of the AWS profile in your ~/.aws/credentials or
              ~/.aws/config file
            </p>
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
                permissions. Make sure you&#39;ve run{" "}
                <code>aws sso login --profile {formData.profile}</code> in your
                terminal.
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
              {isLoading ? "Saving..." : "Save Profile Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start">
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-center">
            <Key className="h-4 w-4 mr-2" />
            This uses the AWS credentials from your local AWS configuration.
          </p>
          <p>
            If you&#39;re using AWS SSO, make sure to run{" "}
            <code>aws sso login --profile {formData.profile}</code> in your
            terminal first.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
