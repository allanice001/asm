import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin, createAuditLog } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const isUserAdmin = await isAdmin();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    // Only admins can view other users
    if (currentUser.id !== userId && !isUserAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Error fetching user" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    // Only admins can update other users
    if (currentUser.id !== userId && currentUser.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const data = await request.json();

    // Validate role if changing
    if (data.role && !["user", "admin"].includes(data.role)) {
      return NextResponse.json(
        { message: "Invalid role. Must be 'user' or 'admin'" },
        { status: 400 },
      );
    }

    // Only admins can change roles
    if (data.role && currentUser.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized to change role" },
        { status: 403 },
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Update user
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.role && currentUser.role === "admin") updateData.role = data.role;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Create audit log
    await createAuditLog(currentUser.id, "update", "user", user.id.toString(), {
      name: user.name,
      role: user.role,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Error updating user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const userId = params.id;

    // Prevent deleting yourself
    if (currentUser.id === userId) {
      return NextResponse.json(
        { message: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Create audit log
    await createAuditLog(currentUser.id, "delete", "user", userId.toString(), {
      name: existingUser.name,
      email: existingUser.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Error deleting user" },
      { status: 500 },
    );
  }
}
