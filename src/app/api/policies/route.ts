import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Get all policies
export async function GET(req: NextRequest) {
  // Check if user is authenticated
  const authError = await requireAuth(req);
  if (authError) return authError;

  try {
    const policies = await prisma.policy.findMany({
      include: {
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ policies });
  } catch (error) {
    console.error("Error fetching policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 },
    );
  }
}

// Create a new policy
export async function POST(req: NextRequest) {
  // Check if user is authenticated and has editor or admin role
  const authError = await requireAuth(req, [UserRole.ADMIN, UserRole.EDITOR]);
  if (authError) return authError;

  try {
    const { name, description, policyDocument, type } = await req.json();

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Validate policy document is valid JSON
    try {
      JSON.parse(policyDocument);
    } catch (e) {
      return NextResponse.json(
        { error: `Invalid policy document JSON: ${e}` },
        { status: 400 },
      );
    }

    const policy = await prisma.policy.create({
      data: {
        name,
        description,
        policyDocument,
        type: type || "CUSTOM",
      },
    });

    // Record change history
    await prisma.policyChangeHistory.create({
      data: {
        policyId: policy.id,
        changeType: "create",
        newState: JSON.stringify({
          name,
          description,
          policyDocument,
          type: type || "CUSTOM",
        }),
        changedBy: user.id,
      },
    });

    return NextResponse.json({ policy });
  } catch (error) {
    console.error("Error creating policy:", error);
    return NextResponse.json(
      { error: "Failed to create policy" },
      { status: 500 },
    );
  }
}
