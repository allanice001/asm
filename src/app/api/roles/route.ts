import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all roles
export async function GET() {
  try {
    const roles = await prisma.role.findMany();

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 },
    );
  }
}

// Create a new role
export async function POST(request: Request) {
  try {
    const { name, description, trustPolicy, changedBy } = await request.json();

    const role = await prisma.role.create({
      data: {
        name,
        description,
        trustPolicy,
      },
    });

    // Record change history
    await prisma.roleChangeHistory.create({
      data: {
        roleId: role.id,
        changeType: "create",
        newState: JSON.stringify({
          name,
          description,
          trustPolicy,
        }),
        changedBy,
      },
    });

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 },
    );
  }
}
