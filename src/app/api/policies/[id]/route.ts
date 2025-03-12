import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Get a specific policy
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check if user is authenticated
  const authError = await requireAuth(req);
  if (authError) return authError;

  try {
    const policy = await prisma.policy.findUnique({
      where: { id: params.id },
      include: {
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
        changeHistory: {
          include: {
            changedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json({ policy });
  } catch (error) {
    console.error("Error fetching policy:", error);
    return NextResponse.json(
      { error: "Failed to fetch policy" },
      { status: 500 },
    );
  }
}

// Update a policy
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check if user is authenticated and has editor or admin role
  const authError = await requireAuth(req, [UserRole.ADMIN, UserRole.EDITOR]);
  if (authError) return authError;

  try {
    const { name, description, policyDocument, roleIds } = await req.json();

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

    // Get current state for change history
    const currentPolicy = await prisma.policy.findUnique({
      where: { id: params.id },
      include: {
        roles: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!currentPolicy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    // Update policy
    const updatedPolicy = await prisma.policy.update({
      where: { id: params.id },
      data: {
        name,
        description,
        policyDocument,
        roles: {
          set: roleIds ? roleIds.map((id: string) => ({ id })) : [],
        },
      },
      include: {
        roles: true,
      },
    });

    // Record change history
    await prisma.policyChangeHistory.create({
      data: {
        policyId: params.id,
        changeType: "update",
        previousState: JSON.stringify({
          name: currentPolicy.name,
          description: currentPolicy.description,
          policyDocument: currentPolicy.policyDocument,
          roleIds: currentPolicy.roles.map((role) => role.id),
        }),
        newState: JSON.stringify({
          name,
          description,
          policyDocument,
          roleIds: roleIds || [],
        }),
        changedBy: user.id,
      },
    });

    return NextResponse.json({ policy: updatedPolicy });
  } catch (error) {
    console.error("Error updating policy:", error);
    return NextResponse.json(
      { error: "Failed to update policy" },
      { status: 500 },
    );
  }
}

// Delete a policy
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check if user is authenticated and has admin role
  const authError = await requireAuth(req, UserRole.ADMIN);
  if (authError) return authError;

  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get current state for change history
    const currentPolicy = await prisma.policy.findUnique({
      where: { id: params.id },
      include: {
        roles: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!currentPolicy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    // Record change history before deletion
    await prisma.policyChangeHistory.create({
      data: {
        policyId: params.id,
        changeType: "delete",
        previousState: JSON.stringify({
          name: currentPolicy.name,
          description: currentPolicy.description,
          policyDocument: currentPolicy.policyDocument,
          roleIds: currentPolicy.roles.map((role) => role.id),
        }),
        newState: "{}",
        changedBy: user.id,
      },
    });

    // Delete the policy
    await prisma.policy.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting policy:", error);
    return NextResponse.json(
      { error: "Failed to delete policy" },
      { status: 500 },
    );
  }
}
