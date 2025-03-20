"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertCircle, Key } from "lucide-react";
import { AwsCredentialsForm } from "@/components/aws-credentials-form";
import { AwsProfileForm } from "@/components/aws-profile-form";

export default function AwsCredentialsPage() {
  const [credentialStatus, setCredentialStatus] = useState<{
    status: "loading" | "valid" | "invalid" | "error";
    message: string;
    details?: any;
  }>({
    status: "loading",
    message: "Checking AWS credentials...",
  });

  useEffect(() => {
    const checkCredentials = async () => {
      try {
        const response = await fetch("/api/settings/aws-credentials/test");

        if (!response.ok) {
          const error = await response.json();
          setCredentialStatus({
            status: "invalid",
            message: error.message || "Failed to validate AWS credentials",
          });
          return;
        }

        const data = await response.json();

        if (data.valid) {
          setCredentialStatus({
            status: "valid",
            message: "AWS credentials are valid",
            details: data.details,
          });
        } else {
          setCredentialStatus({
            status: "invalid",
            message: data.message || "AWS credentials are invalid or missing",
          });
        }
      } catch (error) {
        setCredentialStatus({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "An error occurred while checking credentials",
        });
      }
    };

    checkCredentials();
  }, []);

  const handleRefresh = () => {
    setCredentialStatus({
      status: "loading",
      message: "Checking AWS credentials...",
    });

    // Re-run the effect
    const checkCredentials = async () => {
      try {
        const response = await fetch("/api/settings/aws-credentials/test");

        if (!response.ok) {
          const error = await response.json();
          setCredentialStatus({
            status: "invalid",
            message: error.message || "Failed to validate AWS credentials",
          });
          return;
        }

        const data = await response.json();

        if (data.valid) {
          setCredentialStatus({
            status: "valid",
            message: "AWS credentials are valid",
            details: data.details,
          });
        } else {
          setCredentialStatus({
            status: "invalid",
            message: data.message || "AWS credentials are invalid or missing",
          });
        }
      } catch (error) {
        setCredentialStatus({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "An error occurred while checking credentials",
        });
      }
    };

    checkCredentials();
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">AWS Credentials</h1>

      <Tabs defaultValue="status">
        <TabsList className="mb-4">
          <TabsTrigger value="status">Credential Status</TabsTrigger>
          <TabsTrigger value="configure">Configure Credentials</TabsTrigger>
          <TabsTrigger value="profile">AWS Profile</TabsTrigger>
          <TabsTrigger value="help">Help & Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Credential Status</CardTitle>
              <CardDescription>Status of your AWS credentials</CardDescription>
            </CardHeader>
            <CardContent>
              {credentialStatus.status === "loading" ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin">⟳</div>
                  <p>{credentialStatus.message}</p>
                </div>
              ) : credentialStatus.status === "valid" ? (
                <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <AlertTitle className="text-green-800 dark:text-green-300">
                    Valid Credentials
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {credentialStatus.message}
                  </AlertDescription>

                  {credentialStatus.details && (
                    <div className="mt-4 space-y-2">
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                        Credential Details:
                      </h3>
                      <div className="rounded-md bg-green-100 dark:bg-green-900/30 p-3 text-sm">
                        <p>
                          <strong>Account ID:</strong>{" "}
                          {credentialStatus.details.accountId}
                        </p>
                        <p>
                          <strong>User ARN:</strong>{" "}
                          {credentialStatus.details.userArn}
                        </p>
                        <p>
                          <strong>User ID:</strong>{" "}
                          {credentialStatus.details.userId}
                        </p>
                      </div>
                    </div>
                  )}
                </Alert>
              ) : credentialStatus.status === "invalid" ? (
                <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <AlertTitle className="text-red-800 dark:text-red-300">
                    Invalid Credentials
                  </AlertTitle>
                  <AlertDescription className="text-red-700 dark:text-red-400">
                    {credentialStatus.message}
                  </AlertDescription>
                  <div className="mt-4">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Please configure your AWS credentials in the
                      &#34;Configure Credentials&#34; tab or set up an AWS
                      profile in the &#34;AWS Profile&#34; tab.
                    </p>
                  </div>
                </Alert>
              ) : (
                <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <AlertTitle className="text-amber-800 dark:text-amber-300">
                    Error Checking Credentials
                  </AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    {credentialStatus.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-4">
                <Button onClick={handleRefresh} variant="outline">
                  Refresh Credential Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configure">
          <AwsCredentialsForm />
        </TabsContent>

        <TabsContent value="profile">
          <AwsProfileForm />
        </TabsContent>

        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle>AWS Credential Configuration</CardTitle>
              <CardDescription>
                How to configure AWS credentials for this application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This application uses the AWS SDK to interact with AWS services.
                You can configure your AWS credentials in several ways:
              </p>

              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">
                    1. Using AWS SSO (Recommended)
                  </h3>
                  <p className="mb-2">
                    To use AWS SSO credentials, run the following command in
                    your terminal:
                  </p>
                  <pre className="bg-muted-foreground/10 p-2 rounded-md overflow-x-auto">
                    aws sso login --profile your-sso-profile
                  </pre>
                  <p className="mt-2 text-sm text-muted-foreground">
                    After logging in with SSO, go to the &#34;AWS Profile&#34;
                    tab and set the profile name.
                  </p>
                </div>

                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">
                    2. Using the Credentials Form
                  </h3>
                  <p className="mb-2">
                    You can use the &#34;Configure Credentials&#34; tab to enter
                    your AWS Access Key ID and Secret Access Key.
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Key className="h-4 w-4 mr-2" />
                    <p>
                      Your credentials will be securely stored as environment
                      variables.
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">
                    3. Using Environment Variables
                  </h3>
                  <p className="mb-2">
                    You can set the following environment variables:
                  </p>
                  <pre className="bg-muted-foreground/10 p-2 rounded-md overflow-x-auto">
                    AWS_ACCESS_KEY_ID=your_access_key_id
                    AWS_SECRET_ACCESS_KEY=your_secret_access_key
                    AWS_REGION=us-east-1
                  </pre>
                </div>

                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">
                    4. Using EC2 Instance Profiles
                  </h3>
                  <p>
                    If you&#39;re running this application on an EC2 instance,
                    you can use an instance profile to provide credentials. No
                    additional configuration is needed in the application.
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Best Practices</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>
                      Use temporary credentials or IAM roles instead of
                      long-term access keys when possible
                    </li>
                    <li>
                      Ensure your IAM user or role has only the minimum
                      permissions needed
                    </li>
                    <li>
                      Regularly rotate your access keys if you&#39;re using them
                    </li>
                    <li>Never commit access keys to source control</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
