import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // Search for AWS accounts
    const accounts = await prisma.awsAccount.findMany({
      where: {
        OR: [
          { accountName: { contains: query, mode: "insensitive" } },
          { accountId: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        accountName: true,
        accountId: true,
      },
    });

    // Search for permission sets
    const permissionSets = await prisma.permissionSet.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    // Search for policies
    const policies = await prisma.policy.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    // Search for users (admin only)
    let users = [];
    if (currentUser.role === "admin") {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    }

    // Format results
    const formattedAccounts = accounts.map((account) => ({
      id: account.id,
      name: account.accountName,
      description: `Account ID: ${account.accountId}`,
      type: "account",
    }));

    const formattedPermissionSets = permissionSets.map((permissionSet) => ({
      id: permissionSet.id,
      name: permissionSet.name,
      description: permissionSet.description,
      type: "permission-set",
    }));

    const formattedPolicies = policies.map((policy) => ({
      id: policy.id,
      name: policy.name,
      description: policy.description,
      type: "policy",
    }));

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      description: user.email,
      type: "user",
    }));

    // Combine and return results
    const results = [
      ...formattedAccounts,
      ...formattedPermissionSets,
      ...formattedPolicies,
      ...formattedUsers,
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ message: "Error searching" }, { status: 500 });
  }
}
