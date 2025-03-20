import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const accountId = params.id;

    const accountPermissionSets = await prisma.accountPermissionSet.findMany({
      where: {
        accountId,
      },
      include: {
        permissionSet: true,
      },
    });

    return NextResponse.json(accountPermissionSets);
  } catch (error) {
    console.error("Error fetching account permission sets:", error);
    return NextResponse.json(
      { message: "Error fetching account permission sets" },
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
    const accountId = params.id;

    const { permissionSetIds } = await request.json();

    // Validate account exists
    const account = await prisma.awsAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json(
        { message: "Account not found" },
        { status: 404 },
      );
    }

    // Delete existing assignments
    await prisma.accountPermissionSet.deleteMany({
      where: { accountId },
    });

    // Create new assignments
    if (permissionSetIds && permissionSetIds.length > 0) {
      await prisma.accountPermissionSet.createMany({
        data: permissionSetIds.map((permissionSetId: number) => ({
          accountId,
          permissionSetId,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating account permission sets:", error);
    return NextResponse.json(
      { message: "Error updating account permission sets" },
      { status: 500 },
    );
  }
}
