import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Get all permission sets
export async function GET(req: NextRequest) {
  // Check if user is authenticated
  const authError = await requireAuth(req);
  if (authError) return authError;

  try {
    const permissionSets = await prisma.permissionSet.findMany({
      include: {
        assignments: {
          include: {
            account: true,
          },
        },
      },
    });

    return NextResponse.json({ permissionSets });
  } catch (error) {
    console.error("Error fetching permission sets:", error);
    return NextResponse.json(
      { error: "Failed to fetch permission sets" },
      { status: 500 },
    );
  }
}

// Create a new permission set
export async function POST(req: NextRequest) {
  // Check if user is authenticated and has editor or admin role
  const authError = await requireAuth(req, [UserRole.ADMIN, UserRole.EDITOR]);
  if (authError) return authError;

  try {
    const {
      name,
      description,
      sessionDuration,
      managedPolicies,
      inlinePolicy,
    } = await req.json();

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const permissionSet = await prisma.permissionSet.create({
      data: {
        name,
        description,
        sessionDuration,
        managedPolicies,
        inlinePolicy,
      },
    });

    // Record change history
    await prisma.permissionSetChangeHistory.create({
      data: {
        permissionSetId: permissionSet.id,
        changeType: "create",
        newState: JSON.stringify({
          name,
          description,
          sessionDuration,
          managedPolicies,
          inlinePolicy,
        }),
        changedBy: user.id,
      },
    });

    return NextResponse.json({ permissionSet });
  } catch (error) {
    console.error("Error creating permission set:", error);
    return NextResponse.json(
      { error: "Failed to create permission set" },
      { status: 500 },
    );
  }
}
