import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

// In a real application, you would store these in a secure database or secret manager
// For this demo, we'll use in-memory storage
let awsCredentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  region: process.env.AWS_REGION || "us-east-1",
};

export async function GET() {
  return NextResponse.json({
    accessKeyId: awsCredentials.accessKeyId,
    // Don't return the secret key for security reasons
    secretAccessKey: "",
    region: awsCredentials.region,
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Validate required fields
    if (!data.accessKeyId || !data.secretAccessKey || !data.region) {
      return NextResponse.json(
        {
          message: "Access Key ID, Secret Access Key, and Region are required",
        },
        { status: 400 },
      );
    }

    // Test the credentials before saving
    const stsClient = new STSClient({
      credentials: {
        accessKeyId: data.accessKeyId,
        secretAccessKey: data.secretAccessKey,
      },
      region: data.region,
    });

    try {
      // Attempt to get caller identity to validate credentials
      const command = new GetCallerIdentityCommand({});
      await stsClient.send(command);
    } catch (credError) {
      return NextResponse.json(
        {
          message:
            "Invalid AWS credentials. Please check your Access Key ID and Secret Access Key.",
          error:
            credError instanceof Error ? credError.message : String(credError),
        },
        { status: 400 },
      );
    }

    // Update credentials
    awsCredentials = {
      accessKeyId: data.accessKeyId,
      secretAccessKey: data.secretAccessKey,
      region: data.region,
    };

    // In a real application, you would update environment variables or a secure store
    // For this demo, we'll just update our in-memory storage
    process.env.AWS_ACCESS_KEY_ID = data.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = data.secretAccessKey;
    process.env.AWS_REGION = data.region;

    // Log that credentials have been updated
    console.log("AWS credentials updated successfully");

    return NextResponse.json({
      message: "AWS credentials updated successfully",
    });
  } catch (error) {
    console.error("Error updating AWS credentials:", error);
    return NextResponse.json(
      {
        message: "Error updating AWS credentials",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
