import {
  ListAccountsCommand,
  ListOrganizationalUnitsForParentCommand,
  ListAccountsForParentCommand,
  ListRootsCommand,
  DescribeOrganizationalUnitCommand,
} from "@aws-sdk/client-organizations";
import { createOrganizationsClient } from "@/lib/aws-client";

// Function to list all AWS accounts in the organization
export async function listAwsAccounts() {
  const client = createOrganizationsClient();
  const command = new ListAccountsCommand({});

  try {
    const response = await client.send(command);
    return response.Accounts || [];
  } catch (error) {
    console.error("Error listing AWS accounts:", error);
    throw error;
  }
}

// Function to get the organization root ID
export async function getOrganizationRootId() {
  const client = createOrganizationsClient();
  const command = new ListRootsCommand({});

  try {
    const response = await client.send(command);
    if (!response.Roots || response.Roots.length === 0) {
      throw new Error("No organization roots found");
    }
    return response.Roots[0].Id;
  } catch (error) {
    console.error("Error getting organization root ID:", error);
    throw error;
  }
}

// Function to list all OUs under a parent
export async function listOrganizationalUnits(parentId) {
  const client = createOrganizationsClient();
  const command = new ListOrganizationalUnitsForParentCommand({
    ParentId: parentId,
  });

  try {
    const response = await client.send(command);
    return response.OrganizationalUnits || [];
  } catch (error) {
    console.error(
      `Error listing organizational units for parent ${parentId}:`,
      error,
    );
    return [];
  }
}

// Function to list all accounts in an OU
export async function listAccountsInOU(parentId) {
  const client = createOrganizationsClient();
  const command = new ListAccountsForParentCommand({
    ParentId: parentId,
  });

  try {
    const response = await client.send(command);
    return response.Accounts || [];
  } catch (error) {
    console.error(`Error listing accounts in OU ${parentId}:`, error);
    return [];
  }
}

// Function to get OU details
export async function getOrganizationalUnitDetails(ouId) {
  const client = createOrganizationsClient();
  const command = new DescribeOrganizationalUnitCommand({
    OrganizationalUnitId: ouId,
  });

  try {
    const response = await client.send(command);
    return response.OrganizationalUnit;
  } catch (error) {
    console.error("Error getting OU details:", error);
    throw error;
  }
}

// Function to build the OU structure and map accounts to their paths
export async function buildOUStructure() {
  try {
    // Get the root ID
    const rootId = await getOrganizationRootId();
    console.log(`Root ID: ${rootId}`);

    // Initialize the structure with the root
    const ouStructure = {
      id: rootId,
      name: "Root",
      path: "/",
      accounts: [],
      children: [],
    };

    // Map to store account paths by ID
    const accountPaths = {};

    // Recursively build the OU structure
    await buildOURecursive(rootId, ouStructure, "/", accountPaths);

    return { ouStructure, accountPaths };
  } catch (error) {
    console.error("Error building OU structure:", error);
    throw error;
  }
}

// Recursive function to build the OU structure
async function buildOURecursive(
  parentId,
  parentNode,
  parentPath,
  accountPaths,
) {
  try {
    // Get accounts directly under this parent
    const accounts = await listAccountsInOU(parentId);
    console.log(`Found ${accounts.length} accounts under ${parentId}`);

    // Add accounts to the parent node
    for (const account of accounts) {
      if (account.Id) {
        parentNode.accounts.push({
          id: account.Id,
          name: account.Name,
          email: account.Email,
        });

        // Store the path for this account
        accountPaths[account.Id] = parentPath;
      }
    }

    // Get child OUs
    const childOUs = await listOrganizationalUnits(parentId);
    console.log(`Found ${childOUs.length} OUs under ${parentId}`);

    // Process each child OU
    for (const ou of childOUs) {
      if (ou.Id && ou.Name) {
        // Create the child node
        const childPath = `${parentPath}${ou.Name}/`;
        const childNode = {
          id: ou.Id,
          name: ou.Name,
          path: childPath,
          accounts: [],
          children: [],
        };

        // Add the child to the parent
        parentNode.children.push(childNode);

        // Recursively process this child
        await buildOURecursive(ou.Id, childNode, childPath, accountPaths);
      }
    }
  } catch (error) {
    console.error(`Error processing OU ${parentId}:`, error);
    // Continue with other OUs instead of failing the entire process
  }
}
