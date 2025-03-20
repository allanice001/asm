import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const accounts = await prisma.awsAccount.findMany({
      orderBy: {
        accountName: "asc",
      },
      select: {
        id: true,
        accountId: true,
        accountName: true,
        accountEmail: true,
        organizationId: true,
        isManagement: true,
        ouPath: true,
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { message: "Error fetching accounts" },
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

    // Validate account ID format
    if (!/^\d{12}$/.test(data.accountId)) {
      return NextResponse.json(
        { message: "Account ID must be a 12-digit number" },
        { status: 400 },
      );
    }

    // Check if account already exists
    const existingAccount = await prisma.awsAccount.findUnique({
      where: { accountId: data.accountId },
    });

    if (existingAccount) {
      return NextResponse.json(
        { message: "Account with this ID already exists" },
        { status: 409 },
      );
    }

    const account = await prisma.awsAccount.create({
      data: {
        accountId: data.accountId,
        accountName: data.accountName,
        accountEmail: data.accountEmail,
        organizationId: data.organizationId || null,
        isManagement: data.isManagement || false,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { message: "Error creating account" },
      { status: 500 },
    );
  }
}
