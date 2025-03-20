import type { OUNode, AccountNode } from "@/components/ou-tree-view";

export function buildOUTree(accounts: AccountNode[]): OUNode {
  // Create the root node
  const root: OUNode = {
    id: "root",
    name: "Organization Root",
    children: [],
    accounts: [],
    path: "/",
  };

  // Map to store OU nodes by path for quick access
  const ouMap: Record<string, OUNode> = {
    "/": root,
  };

  // First pass: create all OU nodes
  accounts.forEach((account) => {
    if (!account.ouPath) return;

    const pathParts = account.ouPath.split("/").filter(Boolean);
    let currentPath = "/";

    // Create or find each OU in the path
    pathParts.forEach((part) => {
      const parentPath = currentPath;
      currentPath = currentPath === "/" ? `/${part}` : `${currentPath}/${part}`;

      if (!ouMap[currentPath]) {
        const newNode: OUNode = {
          id: part,
          name: part,
          children: [],
          accounts: [],
          path: currentPath,
        };
        ouMap[currentPath] = newNode;
        ouMap[parentPath].children.push(newNode);
      }
    });
  });

  // Second pass: add accounts to their respective OUs
  accounts.forEach((account) => {
    const ouPath = account.ouPath || "/";
    if (ouMap[ouPath]) {
      ouMap[ouPath].accounts.push(account);
    } else {
      // If OU doesn't exist (e.g., account not in any OU), add to root
      root.accounts.push(account);
    }
  });

  return root;
}

// Helper function to get all account IDs in an OU and its children
export function getAllAccountIdsInOU(node: OUNode): number[] {
  const directAccountIds = node.accounts.map((account) => account.id);
  const childOUAccountIds = node.children.flatMap((childOU) =>
    getAllAccountIdsInOU(childOU),
  );

  return [...directAccountIds, ...childOUAccountIds];
}
