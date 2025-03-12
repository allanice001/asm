import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a specific role
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        changeHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 },
    );
  }
}

// Update a role
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { name, description, trustPolicy, changedBy } = await request.json();

    // Get current state for change history
    const currentRole = await prisma.role.findUnique({
      where: { id: params.id },
    });

    if (!currentRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: params.id },
      data: {
        name,
        description,
        trustPolicy,
      },
    });

    // Record change history
    await prisma.roleChangeHistory.create({
      data: {
        roleId: params.id,
        changeType: "update",
        previousState: JSON.stringify({
          name: currentRole.name,
          description: currentRole.description,
          trustPolicy: currentRole.trustPolicy,
        }),
        newState: JSON.stringify({
          name,
          description,
          trustPolicy,
        }),
        changedBy,
      },
    });

    return NextResponse.json({ role: updatedRole });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 },
    );
  }
}

// Delete a role
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { changedBy } = await request.json();

    // Get current state for change history
    const currentRole = await prisma.role.findUnique({
      where: { id: params.id },
    });

    if (!currentRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Record change history before deletion
    await prisma.roleChangeHistory.create({
      data: {
        roleId: params.id,
        changeType: "delete",
        previousState: JSON.stringify({
          name: currentRole.name,
          description: currentRole.description,
          trustPolicy: currentRole.trustPolicy,
        }),
        newState: "{}",
        changedBy,
      },
    });

    // Delete the role
    await prisma.role.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 },
    );
  }
}
