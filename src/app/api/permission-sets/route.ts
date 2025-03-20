import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const permissionSets = await prisma.permissionSet.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        policies: {
          include: {
            policy: true,
          },
        },
      },
    });

    return NextResponse.json(permissionSets);
  } catch (error) {
    console.error("Error fetching permission sets:", error);
    return NextResponse.json(
      { message: "Error fetching permission sets" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
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

    // Check if permission set with the same name already exists
    const existingPermissionSet = await prisma.permissionSet.findUnique({
      where: { name: data.name },
    });

    if (existingPermissionSet) {
      return NextResponse.json(
        { message: "Permission set with this name already exists" },
        { status: 409 },
      );
    }

    const permissionSet = await prisma.permissionSet.create({
      data: {
        name: data.name,
        description: data.description,
        sessionDuration: data.sessionDuration,
        relayState: data.relayState || null,
      },
    });

    return NextResponse.json(permissionSet, { status: 201 });
  } catch (error) {
    console.error("Error creating permission set:", error);
    return NextResponse.json(
      { message: "Error creating permission set" },
      { status: 500 },
    );
  }
}
