import { type NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  // Check if user is authenticated
  const authError = await requireAuth(req);
  if (authError) return authError;

  try {
    const { name, currentPassword, newPassword } = await req.json();

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Prepare update data
    const updateData: any = { name };

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 },
        );
      }

      // Get user with password
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      });

      if (!userWithPassword?.password) {
        return NextResponse.json(
          { error: "User has no password set" },
          { status: 400 },
        );
      }

      // Verify current password
      const isPasswordValid = await compare(
        currentPassword,
        userWithPassword.password,
      );
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      // Hash new password
      updateData.password = await hash(newPassword, 10);
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
