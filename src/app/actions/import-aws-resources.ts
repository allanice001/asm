"use server";

import { listAwsAccounts, buildOUStructure } from "@/lib/aws-utils";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function importAwsAccounts() {
  try {
    // Log that we're starting the import process
    console.log("Starting AWS accounts import process...");

    // Check if AWS credentials are available
    /*
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error("AWS credentials are missing")
      return {
        success: false,
        message: "Credential is missing. Please configure your AWS credentials in the AWS Credentials settings.",
      }
    }
 */

    console.log("Building OU structure...");
    // Build the OU structure and get account paths
    const { accountPaths } = await buildOUStructure();
    console.log(
      `Built OU structure with paths for ${Object.keys(accountPaths).length} accounts`,
    );

    console.log("Fetching AWS accounts...");
    const awsAccounts = await listAwsAccounts();
    console.log(`Found ${awsAccounts.length} AWS accounts`);

    let successCount = 0;
    let errorCount = 0;

    // Process each account
    for (const account of awsAccounts) {
      if (!account.Id || !account.Name || !account.Email) continue;
      console.log(JSON.stringify(account, null, 2))
      try {
        console.log(`Processing account ${account.Id} (${account.Name})`);

        // Get the OU path for this account
        const ouPath = accountPaths[account.Id] || "/";
        console.log(`OU path for account ${account.Id}: ${ouPath}`);

        // Check if account already exists
        const existingAccount = await prisma.awsAccount.findUnique({
          where: { accountId: account.Id },
        });

        if (!existingAccount) {
          // Create new account
          console.log(`Creating new account record for ${account.Id}`);
          await prisma.awsAccount.create({
            data: {
              accountId: account.Id,
              accountName: account.Name,
              accountEmail: account.Email,
              organizationId: account.Arn?.split("/")[1]?.split(":")[0] || null,
              isManagement: false, // Set manually later
              ouPath: ouPath,
            },
          });
        } else {
          // Update existing account
          console.log(`Updating existing account record for ${account.Id}`);
          await prisma.awsAccount.update({
            where: { accountId: account.Id },
            data: {
              accountName: account.Name,
              accountEmail: account.Email,
              organizationId: account.Arn?.split("/")[1]?.split(":")[0] || null,
              ouPath: ouPath,
            },
          });
        }
        successCount++;
      } catch (accountError) {
        console.error(`Error processing account ${account.Id}:`, accountError);
        errorCount++;
        // Continue with the next account instead of failing the entire import
      }
    }

    console.log(
      `Import completed: ${successCount} accounts processed, ${errorCount} errors`,
    );
    revalidatePath("/accounts");
    return {
      success: true,
      message: `AWS accounts imported successfully. ${successCount} accounts processed, ${errorCount} errors.`,
    };
  } catch (error) {
    console.error("Error importing AWS accounts:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (
        error.name === "CredentialsProviderError" ||
        error.message.includes("credential")
      ) {
        return {
          success: false,
          message:
            "Credential is missing. Please configure your AWS credentials in the AWS Credentials settings.",
        };
      } else if (
        error.name === "AccessDeniedException" ||
        error.message.includes("Access Denied")
      ) {
        return {
          success: false,
          message:
            "Access denied. Your AWS credentials don't have sufficient permissions to access AWS Organizations.",
        };
      }
    }

    return {
      success: false,
      message: `Error importing AWS accounts: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function importAwsPolicies() {
  // Implementation for importing AWS policies
  return {
    success: false,
    message: "Not implemented yet",
  };
}

export async function importAwsPermissionSets() {
  // Implementation for importing AWS permission sets
  return {
    success: false,
    message: "Not implemented yet",
  };
}
