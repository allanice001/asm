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
import { useToast } from "@/hooks/use-toast";

interface AwsSsoConfig {
  instanceArn: string;
  region: string;
}

export default function AwsSsoSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<AwsSsoConfig>({
    instanceArn: "",
    region: "us-east-1",
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/settings/aws-sso");
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error("Error fetching AWS SSO config:", error);
      }
    };

    fetchConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/settings/aws-sso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Failed to save AWS SSO configuration",
        );
      }

      toast({
        title: "Configuration saved",
        description: "AWS SSO configuration has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save AWS SSO configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">AWS SSO Configuration</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>AWS SSO Settings</CardTitle>
            <CardDescription>
              Configure the AWS SSO instance to use for deployments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instanceArn">AWS SSO Instance ARN</Label>
              <Input
                id="instanceArn"
                name="instanceArn"
                placeholder="arn:aws:sso:::instance/ssoins-1234567890abcdef"
                value={config.instanceArn}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                The ARN of your AWS SSO instance
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">AWS Region</Label>
              <Input
                id="region"
                name="region"
                placeholder="us-east-1"
                value={config.region}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                The AWS region where your SSO instance is deployed
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Configuration"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
