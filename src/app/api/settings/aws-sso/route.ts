import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// Define a settings model in memory since we don't have it in the schema
interface AwsSsoSettings {
  instanceArn: string;
  region: string;
}

// In a real application, this would be stored in the database
let awsSsoSettings: AwsSsoSettings = {
  instanceArn: "",
  region: "us-east-1",
};

export async function GET() {
  return NextResponse.json(awsSsoSettings);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Validate required fields
    if (!data.instanceArn) {
      return NextResponse.json(
        { message: "AWS SSO Instance ARN is required" },
        { status: 400 },
      );
    }

    if (!data.region) {
      return NextResponse.json(
        { message: "AWS Region is required" },
        { status: 400 },
      );
    }

    // Update settings
    awsSsoSettings = {
      instanceArn: data.instanceArn,
      region: data.region,
    };

    return NextResponse.json(awsSsoSettings);
  } catch (error) {
    console.error("Error updating AWS SSO settings:", error);
    return NextResponse.json(
      { message: "Error updating AWS SSO settings" },
      { status: 500 },
    );
  }
}
