import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Get policies for a specific role
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check if user is authenticated
  const authError = await requireAuth(req);
  if (authError) return authError;

  try {
    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        policies: true,
      },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ policies: role.policies });
  } catch (error) {
    console.error("Error fetching role policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch role policies" },
      { status: 500 },
    );
  }
}

// Update policies for a role
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check if user is authenticated and has editor or admin role
  const authError = await requireAuth(req, [UserRole.ADMIN, UserRole.EDITOR]);
  if (authError) return authError;

  try {
    const { policyIds } = await req.json();

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get current role
    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        policies: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Update role policies
    const updatedRole = await prisma.role.update({
      where: { id: params.id },
      data: {
        policies: {
          set: policyIds.map((id: string) => ({ id })),
        },
      },
      include: {
        policies: true,
      },
    });

    // Record change in role history
    await prisma.roleChangeHistory.create({
      data: {
        roleId: params.id,
        changeType: "update-policies",
        previousState: JSON.stringify({
          policyIds: role.policies.map((policy) => policy.id),
        }),
        newState: JSON.stringify({
          policyIds,
        }),
        changedBy: user.id,
      },
    });

    return NextResponse.json({ role: updatedRole });
  } catch (error) {
    console.error("Error updating role policies:", error);
    return NextResponse.json(
      { error: "Failed to update role policies" },
      { status: 500 },
    );
  }
}
