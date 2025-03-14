import { fromSSO } from "@aws-sdk/credential-providers";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Organizations } from "@aws-sdk/client-organizations";
import { IAM } from "@aws-sdk/client-iam";
import { SSOAdmin } from "@aws-sdk/client-sso-admin";
import { STSClient } from "@aws-sdk/client-sts";

// Get region from environment variables
const region = process.env.AWS_REGION || "us-east-1";

// Configuration with role ARN if provided
const getRoleConfig = () => {
  const roleArn = process.env.AWS_ROLE_ARN;

  if (roleArn) {
    console.log(`Using role: ${roleArn}`);
    return {
      region,
      credentials: defaultProvider({
        roleArn,
      }),
    };
  }

  // If no role ARN is provided, use SSO credentials
  return {
    region,
    credentials: fromSSO({ profile: "default" }),
  };
};

// Create AWS clients with SSO credentials
export const getOrganizationsClient = () => {
  return new Organizations(getRoleConfig());
};

export const getIAMClient = (assumedCredentials?: any) => {
  if (assumedCredentials) {
    return new IAM({
      region,
      credentials: assumedCredentials,
    });
  }

  return new IAM(getRoleConfig());
};

export const getSSOClient = () => {
  return new SSOAdmin(getRoleConfig());
};

export const getSTSClient = () => {
  return new STSClient(getRoleConfig());
};
