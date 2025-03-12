import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Get policies for a specific role in a specific account
export async function GET(
  req: NextRequest,
  { params }: { params: { accountId: string; roleId: string } },
) {
  // Check if user is authenticated
  const authError = await requireAuth(req);
  if (authError) return authError;

  try {
    // Verify account and role exist
    const account = await prisma.account.findUnique({
      where: { id: params.accountId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const role = await prisma.role.findUnique({
      where: { id: params.roleId },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Get account-specific role-policy assignments
    const assignments = await prisma.accountRolePolicyAssignment.findMany({
      where: {
        accountId: params.accountId,
        roleId: params.roleId,
      },
      include: {
        policy: true,
      },
    });

    // Get global role-policy assignments
    const globalPolicies = await prisma.role.findUnique({
      where: { id: params.roleId },
      include: {
        policies: true,
      },
    });

    return NextResponse.json({
      accountSpecificPolicies: assignments.map((a) => a.policy),
      globalPolicies: globalPolicies?.policies || [],
    });
  } catch (error) {
    console.error("Error fetching role policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch role policies" },
      { status: 500 },
    );
  }
}

// Update policies for a role in a specific account
export async function POST(
  req: NextRequest,
  { params }: { params: { accountId: string; roleId: string } },
) {
  // Check if user is authenticated and has editor or admin role
  const authError = await requireAuth(req, [UserRole.ADMIN, UserRole.EDITOR]);
  if (authError) return authError;

  try {
    const { policyIds, overrideGlobal } = await req.json();

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Verify account and role exist
    const account = await prisma.account.findUnique({
      where: { id: params.accountId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const role = await prisma.role.findUnique({
      where: { id: params.roleId },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Delete existing assignments for this account and role
    await prisma.accountRolePolicyAssignment.deleteMany({
      where: {
        accountId: params.accountId,
        roleId: params.roleId,
      },
    });

    // Create new assignments
    const assignments = await Promise.all(
      policyIds.map((policyId) =>
        prisma.accountRolePolicyAssignment.create({
          data: {
            accountId: params.accountId,
            roleId: params.roleId,
            policyId,
          },
        }),
      ),
    );

    // Record change in role history
    await prisma.roleChangeHistory.create({
      data: {
        roleId: params.roleId,
        changeType: "update-account-policies",
        previousState: null,
        newState: JSON.stringify({
          accountId: params.accountId,
          policyIds,
          overrideGlobal,
        }),
        changedBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error("Error updating role policies:", error);
    return NextResponse.json(
      { error: "Failed to update role policies" },
      { status: 500 },
    );
  }
}
