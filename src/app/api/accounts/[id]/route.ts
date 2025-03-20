import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const accountId = params.id;

    const account = await prisma.awsAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json(
        { message: "Account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { message: "Error fetching account" },
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

    const data = await request.json();

    // Check if account exists
    const existingAccount = await prisma.awsAccount.findUnique({
      where: { id: accountId },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { message: "Account not found" },
        { status: 404 },
      );
    }

    // Update account
    const updatedAccount = await prisma.awsAccount.update({
      where: { id: accountId },
      data: {
        accountName: data.accountName,
        accountEmail: data.accountEmail,
        organizationId: data.organizationId || null,
        isManagement: data.isManagement || false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { message: "Error updating account" },
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
    const accountId = Number.parseInt(params.id);

    if (isNaN(accountId)) {
      return NextResponse.json(
        { message: "Invalid account ID" },
        { status: 400 },
      );
    }

    // Check if account exists
    const existingAccount = await prisma.awsAccount.findUnique({
      where: { id: accountId },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { message: "Account not found" },
        { status: 404 },
      );
    }

    // Delete account
    await prisma.awsAccount.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { message: "Error deleting account" },
      { status: 500 },
    );
  }
}
