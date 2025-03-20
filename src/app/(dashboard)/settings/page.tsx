import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImportAwsResources } from "@/components/import-aws-resources";
import { Settings, Cloud } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AWS SSO Configuration</CardTitle>
            <CardDescription>
              Configure the AWS SSO instance to use for deployments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Set up your AWS SSO instance ARN and region to enable deployments
              to AWS accounts.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/settings/aws-sso">
              <Button>
                <Settings className="mr-2 h-4 w-4" />
                Configure AWS SSO
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AWS Credentials</CardTitle>
            <CardDescription>
              Manage AWS credentials for accessing AWS resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The application uses AWS SSO credentials from your local
              environment or instance profile.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/settings/aws-credentials">
              <Button variant="outline">
                <Cloud className="mr-2 h-4 w-4" />
                View Credential Settings
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <ImportAwsResources />
      </div>
    </div>
  );
}
