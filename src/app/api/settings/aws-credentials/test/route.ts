import { NextResponse } from "next/server";
import { GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { createStsClient } from "@/lib/aws-client";

export async function GET() {
  try {
    console.log("Testing AWS credentials...");

    // Log current environment variables for debugging
    console.log("AWS_PROFILE:", process.env.AWS_PROFILE);
    console.log("AWS_REGION:", process.env.AWS_REGION);

    // Create an STS client to check credentials
    const stsClient = createStsClient();

    // Get caller identity to validate credentials
    const command = new GetCallerIdentityCommand({});
    const response = await stsClient.send(command);

    console.log("AWS credentials are valid:", response);

    return NextResponse.json({
      valid: true,
      message: "AWS credentials are valid",
      details: {
        accountId: response.Account,
        userArn: response.Arn,
        userId: response.UserId,
      },
    });
  } catch (error) {
    console.error("Error checking AWS credentials:", error);

    // Determine the specific error message
    let errorMessage = "Failed to validate AWS credentials";

    if (error instanceof Error) {
      if (
        error.name === "CredentialsProviderError" ||
        error.message.includes("credential")
      ) {
        errorMessage =
          "AWS credentials are missing or invalid. If using AWS SSO, make sure you've run 'aws sso login' recently.";
      } else if (error.name === "ExpiredTokenException") {
        errorMessage =
          "AWS credentials have expired. Please refresh your SSO session with 'aws sso login'.";
      } else if (error.name === "AccessDeniedException") {
        errorMessage = "AWS credentials don't have sufficient permissions";
      } else {
        errorMessage = `AWS credential error: ${error.message}`;
      }
    }

    return NextResponse.json(
      {
        valid: false,
        message: errorMessage,
      },
      { status: 400 },
    );
  }
}
