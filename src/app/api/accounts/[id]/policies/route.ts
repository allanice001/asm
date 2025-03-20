import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const accountId = params.id;

    const accountPolicies = await prisma.accountSpecificPolicy.findMany({
      where: {
        accountId,
      },
      include: {
        policy: true,
      },
    });

    return NextResponse.json(accountPolicies);
  } catch (error) {
    console.error("Error fetching account policies:", error);
    return NextResponse.json(
      { message: "Error fetching account policies" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const accountId = params.id;

    const { policyId, policyDocument } = await request.json();

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

    // Validate policy exists and is account-specific
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      return NextResponse.json(
        { message: "Policy not found" },
        { status: 404 },
      );
    }

    if (!policy.isAccountSpecific) {
      return NextResponse.json(
        { message: "Policy is not marked as account-specific" },
        { status: 400 },
      );
    }

    // Check if policy is already assigned to this account
    const existingPolicy = await prisma.accountSpecificPolicy.findFirst({
      where: {
        accountId,
        policyId,
      },
    });

    if (existingPolicy) {
      // Update existing policy
      const updatedPolicy = await prisma.accountSpecificPolicy.update({
        where: { id: existingPolicy.id },
        data: {
          policyDocument,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(updatedPolicy);
    } else {
      // Create new policy assignment
      const newPolicy = await prisma.accountSpecificPolicy.create({
        data: {
          accountId,
          policyId,
          policyDocument,
        },
      });

      return NextResponse.json(newPolicy, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating account-specific policy:", error);
    return NextResponse.json(
      { message: "Error creating account-specific policy" },
      { status: 500 },
    );
  }
}
