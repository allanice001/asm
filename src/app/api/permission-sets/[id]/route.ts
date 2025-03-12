import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Get a specific permission set
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check if user is authenticated
  const authError = await requireAuth(req);
  if (authError) return authError;

  try {
    const permissionSet = await prisma.permissionSet.findUnique({
      where: { id: params.id },
      include: {
        assignments: {
          include: {
            account: true,
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

    if (!permissionSet) {
      return NextResponse.json(
        { error: "Permission set not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ permissionSet });
  } catch (error) {
    console.error("Error fetching permission set:", error);
    return NextResponse.json(
      { error: "Failed to fetch permission set" },
      { status: 500 },
    );
  }
}

// Update a permission set
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Get current state for change history
    const currentPermissionSet = await prisma.permissionSet.findUnique({
      where: { id: params.id },
    });

    if (!currentPermissionSet) {
      return NextResponse.json(
        { error: "Permission set not found" },
        { status: 404 },
      );
    }

    // Update permission set
    const updatedPermissionSet = await prisma.permissionSet.update({
      where: { id: params.id },
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
        permissionSetId: params.id,
        changeType: "update",
        previousState: JSON.stringify({
          name: currentPermissionSet.name,
          description: currentPermissionSet.description,
          sessionDuration: currentPermissionSet.sessionDuration,
          managedPolicies: currentPermissionSet.managedPolicies,
          inlinePolicy: currentPermissionSet.inlinePolicy,
        }),
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

    // Mark all assignments as out-of-sync
    await prisma.permissionSetAssignment.updateMany({
      where: { permissionSetId: params.id },
      data: { status: "out-of-sync" },
    });

    return NextResponse.json({ permissionSet: updatedPermissionSet });
  } catch (error) {
    console.error("Error updating permission set:", error);
    return NextResponse.json(
      { error: "Failed to update permission set" },
      { status: 500 },
    );
  }
}

// Delete a permission set
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
    const currentPermissionSet = await prisma.permissionSet.findUnique({
      where: { id: params.id },
    });

    if (!currentPermissionSet) {
      return NextResponse.json(
        { error: "Permission set not found" },
        { status: 404 },
      );
    }

    // Record change history before deletion
    await prisma.permissionSetChangeHistory.create({
      data: {
        permissionSetId: params.id,
        changeType: "delete",
        previousState: JSON.stringify({
          name: currentPermissionSet.name,
          description: currentPermissionSet.description,
          sessionDuration: currentPermissionSet.sessionDuration,
          managedPolicies: currentPermissionSet.managedPolicies,
          inlinePolicy: currentPermissionSet.inlinePolicy,
        }),
        newState: "{}",
        changedBy: user.id,
      },
    });

    // Delete all assignments
    await prisma.permissionSetAssignment.deleteMany({
      where: { permissionSetId: params.id },
    });

    // Delete the permission set
    await prisma.permissionSet.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting permission set:", error);
    return NextResponse.json(
      { error: "Failed to delete permission set" },
      { status: 500 },
    );
  }
}
