import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const permissionSetId = params.id;

    const permissionSetPolicies = await prisma.permissionSetPolicy.findMany({
      where: {
        permissionSetId,
      },
      include: {
        policy: true,
      },
    });

    return NextResponse.json(permissionSetPolicies);
  } catch (error) {
    console.error("Error fetching permission set policies:", error);
    return NextResponse.json(
      { message: "Error fetching permission set policies" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const permissionSetId = params.id;

    const { policyIds } = await request.json();

    // Validate permission set exists
    const permissionSet = await prisma.permissionSet.findUnique({
      where: { id: permissionSetId },
    });

    if (!permissionSet) {
      return NextResponse.json(
        { message: "Permission set not found" },
        { status: 404 },
      );
    }

    // Delete existing assignments
    await prisma.permissionSetPolicy.deleteMany({
      where: { permissionSetId },
    });

    // Create new assignments
    if (policyIds && policyIds.length > 0) {
      await prisma.permissionSetPolicy.createMany({
        data: policyIds.map((policyId: number) => ({
          permissionSetId,
          policyId,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating permission set policies:", error);
    return NextResponse.json(
      { message: "Error updating permission set policies" },
      { status: 500 },
    );
  }
}
