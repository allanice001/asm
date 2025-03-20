"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  importAwsAccounts,
  importAwsPolicies,
  importAwsPermissionSets,
} from "@/app/actions/import-aws-resources";
import { Download, Check, AlertCircle, FolderTree, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export function ImportAwsResources() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const handleImportAccounts = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const result = await importAwsAccounts();
      setResult(result);

      toast({
        title: result.success ? "Import Successful" : "Import Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      setResult({
        success: false,
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      });

      toast({
        title: "Import Failed",
        description: "An unexpected error occurred during import.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportPolicies = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const result = await importAwsPolicies();
      setResult(result);

      toast({
        title: result.success ? "Import Successful" : "Import Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      setResult({
        success: false,
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      });

      toast({
        title: "Import Failed",
        description: "An unexpected error occurred during import.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportPermissionSets = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const result = await importAwsPermissionSets();
      setResult(result);

      toast({
        title: result.success ? "Import Successful" : "Import Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      setResult({
        success: false,
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      });

      toast({
        title: "Import Failed",
        description: "An unexpected error occurred during import.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import AWS Resources</CardTitle>
        <CardDescription>
          Import AWS accounts, permission sets, and policies from your AWS
          organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will fetch resources from your AWS organization and import them
          into the application. Make sure you have the necessary permissions
          configured.
        </p>

        {result && (
          <div
            className={`p-4 mb-4 rounded-md ${result.success ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}`}
          >
            <div className="flex items-start">
              {result.success ? (
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              )}
              <div>
                <h3
                  className={`text-sm font-medium ${result.success ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}
                >
                  {result.success ? "Import Successful" : "Import Failed"}
                </h3>
                <p
                  className={`text-sm ${result.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                >
                  {result.message}
                </p>

                {!result.success &&
                  result.message.includes("Credential is missing") && (
                    <div className="mt-2">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        Please configure your AWS credentials in the{" "}
                        <Link
                          href="/settings/aws-credentials"
                          className="underline font-medium"
                        >
                          AWS Credentials settings
                        </Link>
                        .
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="accounts">
          <TabsList className="mb-4">
            <TabsTrigger value="accounts">AWS Accounts</TabsTrigger>
            <TabsTrigger value="permission-sets">Permission Sets</TabsTrigger>
            <TabsTrigger value="policies">AWS Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <p className="text-sm mb-4">
              Import AWS accounts from your AWS Organizations. This will fetch
              all accounts in your organization and their OU structure.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <FolderTree className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Organizational unit (OU) information will be imported for each
                account.
              </p>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Requires valid AWS credentials with Organizations permissions.
              </p>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              <p>
                Note: This process may take a few moments as it needs to make
                multiple API calls to build the complete OU structure.
              </p>
            </div>
            <Button onClick={handleImportAccounts} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import AWS Accounts
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="permission-sets">
            <p className="text-sm mb-4">
              Import permission sets from your AWS SSO instance. This requires
              AWS SSO to be configured.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Requires valid AWS credentials with SSO Admin permissions.
              </p>
            </div>
            <Button onClick={handleImportPermissionSets} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import Permission Sets
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="policies">
            <p className="text-sm mb-4">
              Import AWS managed policies. This will fetch common AWS managed
              policies that can be attached to permission sets.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Requires valid AWS credentials with IAM permissions.
              </p>
            </div>
            <Button onClick={handleImportPolicies} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import AWS Policies
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
