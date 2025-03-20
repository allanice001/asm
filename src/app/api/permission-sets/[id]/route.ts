import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const permissionSetId = params.id;

    const permissionSet = await prisma.permissionSet.findUnique({
      where: { id: permissionSetId },
    });

    if (!permissionSet) {
      return NextResponse.json(
        { message: "Permission set not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(permissionSet);
  } catch (error) {
    console.error("Error fetching permission set:", error);
    return NextResponse.json(
      { message: "Error fetching permission set" },
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

    const data = await request.json();

    // Validate session duration format (ISO 8601 duration)
    if (
      !/^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/.test(
        data.sessionDuration,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid session duration format. Use ISO 8601 duration format (e.g., PT8H)",
        },
        { status: 400 },
      );
    }

    // Check if permission set exists
    const existingPermissionSet = await prisma.permissionSet.findUnique({
      where: { id: permissionSetId },
    });

    if (!existingPermissionSet) {
      return NextResponse.json(
        { message: "Permission set not found" },
        { status: 404 },
      );
    }

    // Check if name is already taken by another permission set
    if (data.name !== existingPermissionSet.name) {
      const nameExists = await prisma.permissionSet.findUnique({
        where: { name: data.name },
      });

      if (nameExists) {
        return NextResponse.json(
          { message: "Permission set with this name already exists" },
          { status: 409 },
        );
      }
    }

    // Update permission set
    const updatedPermissionSet = await prisma.permissionSet.update({
      where: { id: permissionSetId },
      data: {
        name: data.name,
        description: data.description || null,
        sessionDuration: data.sessionDuration,
        relayState: data.relayState || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedPermissionSet);
  } catch (error) {
    console.error("Error updating permission set:", error);
    return NextResponse.json(
      { message: "Error updating permission set" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const permissionSetId = params.id;

    // Check if permission set exists
    const existingPermissionSet = await prisma.permissionSet.findUnique({
      where: { id: permissionSetId },
    });

    if (!existingPermissionSet) {
      return NextResponse.json(
        { message: "Permission set not found" },
        { status: 404 },
      );
    }

    // Delete permission set
    await prisma.permissionSet.delete({
      where: { id: permissionSetId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting permission set:", error);
    return NextResponse.json(
      { message: "Error deleting permission set" },
      { status: 500 },
    );
  }
}
