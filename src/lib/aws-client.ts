import { STSClient } from "@aws-sdk/client-sts";
import { IAMClient } from "@aws-sdk/client-iam";
import { OrganizationsClient } from "@aws-sdk/client-organizations";
import { SSOAdminClient } from "@aws-sdk/client-sso-admin";

// Helper function to get AWS credentials from environment variables
export function getAwsCredentials() {
  // First check server-side environment variables
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "us-east-1";

  // If server-side credentials are not available, log a warning
  if (!accessKeyId || !secretAccessKey) {
    console.warn(
      "Server-side AWS credentials not found. Using default credential provider chain.",
    );
  }

  // Check if credentials are available
  const hasCredentials = accessKeyId && secretAccessKey;

  return {
    credentials: hasCredentials
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined, // Let the AWS SDK use the default credential provider chain
    region,
    hasCredentials,
  };
}

// Create AWS clients with the stored credentials
export function createStsClient() {
  const { credentials, region } = getAwsCredentials();
  return new STSClient({ credentials, region });
}

export function createIamClient() {
  const { credentials, region } = getAwsCredentials();
  return new IAMClient({ credentials, region });
}

export function createOrganizationsClient() {
  const { credentials, region } = getAwsCredentials();
  return new OrganizationsClient({ credentials, region });
}

export function createSsoAdminClient() {
  const { credentials, region } = getAwsCredentials();
  return new SSOAdminClient({ credentials, region });
}
