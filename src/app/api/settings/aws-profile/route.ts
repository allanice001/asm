import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// In a real application, you would store these in a secure database or secret manager
// For this demo, we'll use in-memory storage
let awsProfileSettings = {
  profile: process.env.AWS_PROFILE || "default",
  region: process.env.AWS_REGION || "us-east-1",
};

export async function GET() {
  return NextResponse.json({
    profile: awsProfileSettings.profile,
    region: awsProfileSettings.region,
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
    if (!data.profile || !data.region) {
      return NextResponse.json(
        { message: "Profile name and Region are required" },
        { status: 400 },
      );
    }

    // Update profile settings
    awsProfileSettings = {
      profile: data.profile,
      region: data.region,
    };

    // In a real application, you would update environment variables or a secure store
    // For this demo, we'll just update our in-memory storage
    process.env.AWS_PROFILE = data.profile;
    process.env.AWS_REGION = data.region;

    // Log that profile settings have been updated
    console.log(
      "AWS profile settings updated successfully:",
      awsProfileSettings,
    );

    return NextResponse.json({
      message: "AWS profile settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating AWS profile settings:", error);
    return NextResponse.json(
      {
        message: "Error updating AWS profile settings",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
