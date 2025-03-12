import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Get a specific user
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check if user is authenticated and has admin role
  const authError = await requireAuth(req, UserRole.ADMIN);
  if (authError) return authError;

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

// Update a user
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check if user is authenticated and has admin role
  const authError = await requireAuth(req, UserRole.ADMIN);
  if (authError) return authError;

  try {
    const { name, role, password } = await req.json();

    // Prepare update data
    const updateData: any = {
      name,
      role,
    };

    // If password is provided, hash it
    if (password) {
      updateData.password = await hash(password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

// Delete a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check if user is authenticated and has admin role
  const authError = await requireAuth(req, UserRole.ADMIN);
  if (authError) return authError;

  try {
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
