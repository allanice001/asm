import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all assignments for a permission set
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const assignments = await prisma.permissionSetAssignment.findMany({
      where: { permissionSetId: params.id },
      include: {
        account: true,
      },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 },
    );
  }
}

// Create or update assignments for a permission set
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { accountIds } = await request.json();

    // Verify permission set exists
    const permissionSet = await prisma.permissionSet.findUnique({
      where: { id: params.id },
    });

    if (!permissionSet) {
      return NextResponse.json(
        { error: "Permission set not found" },
        { status: 404 },
      );
    }

    // Get current assignments
    const currentAssignments = await prisma.permissionSetAssignment.findMany({
      where: { permissionSetId: params.id },
    });

    const currentAccountIds = currentAssignments.map((a) => a.accountId);

    // Determine which assignments to add and which to remove
    const accountIdsToAdd = accountIds.filter(
      (id) => !currentAccountIds.includes(id),
    );
    const accountIdsToRemove = currentAccountIds.filter(
      (id) => !accountIds.includes(id),
    );

    // Create new assignments
    const newAssignments = await Promise.all(
      accountIdsToAdd.map((accountId) =>
        prisma.permissionSetAssignment.create({
          data: {
            permissionSetId: params.id,
            accountId,
            status: "pending",
          },
        }),
      ),
    );

    // Remove assignments that are no longer needed
    if (accountIdsToRemove.length > 0) {
      await prisma.permissionSetAssignment.deleteMany({
        where: {
          permissionSetId: params.id,
          accountId: { in: accountIdsToRemove },
        },
      });
    }

    return NextResponse.json({
      added: newAssignments.length,
      removed: accountIdsToRemove.length,
    });
  } catch (error) {
    console.error("Error updating assignments:", error);
    return NextResponse.json(
      { error: "Failed to update assignments" },
      { status: 500 },
    );
  }
}
