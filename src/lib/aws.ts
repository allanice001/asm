import {
  CreatePermissionSetCommand,
  ProvisionPermissionSetCommand,
  AttachManagedPolicyToPermissionSetCommand,
  PutInlinePolicyToPermissionSetCommand,
  ListAccountsForProvisionedPermissionSetCommand,
  ListPermissionSetsCommand,
  DescribePermissionSetCommand,
  ListManagedPoliciesInPermissionSetCommand,
  GetInlinePolicyForPermissionSetCommand,
  DetachManagedPolicyFromPermissionSetCommand,
  DeletePermissionSetCommand,
} from "@aws-sdk/client-sso-admin";
import {
  ListAccountsCommand,
  ListOrganizationalUnitsForParentCommand,
  ListAccountsForParentCommand,
  ListRootsCommand,
  DescribeOrganizationalUnitCommand,
  ListParentsCommand,
} from "@aws-sdk/client-organizations";
import {
  createIamClient,
  createSsoAdminClient,
  createOrganizationsClient,
} from "@/lib/aws-client";

// Initialize AWS clients with better error handling
const getIAMClient = () => {
  return createIamClient();
};

const getSSOAdminClient = () => {
  return createSsoAdminClient();
};

const getOrganizationsClient = () => {
  return createOrganizationsClient();
};

// Function to list all AWS accounts in the organization
export async function listAwsAccounts() {
  const client = getOrganizationsClient();
  const command = new ListAccountsCommand({});

  try {
    const response = await client.send(command);
    return response.Accounts || [];
  } catch (error) {
    console.error("Error listing AWS accounts:", error);
    throw error;
  }
}

// Function to get the root ID of the organization
export async function getOrganizationRootId() {
  const client = getOrganizationsClient();
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
export async function listOrganizationalUnits(parentId: string) {
  const client = getOrganizationsClient();
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
export async function listAccountsInOU(parentId: string) {
  const client = getOrganizationsClient();
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
export async function getOrganizationalUnitDetails(ouId: string) {
  const client = getOrganizationsClient();
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

// Function to get the parent of an account or OU
export async function getParent(childId: string) {
  const client = getOrganizationsClient();

  // Format the childId correctly based on whether it's an account ID or OU ID
  // Account IDs need to be prefixed with "account/"
  const formattedChildId =
    childId.length === 12 && /^\d+$/.test(childId)
      ? `account/${childId}`
      : childId;

  const command = new ListParentsCommand({
    ChildId: formattedChildId,
  });

  try {
    const response = await client.send(command);
    return response.Parents && response.Parents.length > 0
      ? response.Parents[0]
      : null;
  } catch (error) {
    console.error(`Error getting parent for ${childId}:`, error);
    return null;
  }
}

// Function to build the OU path for an account
export async function buildOUPath(accountId: string): Promise<string> {
  try {
    let path = "";
    let currentId = accountId;

    // For accounts, we need to format the ID correctly for the first call
    let parent = await getParent(currentId);

    // If we couldn't get the parent, return the root path
    if (!parent) {
      console.log(`No parent found for account ${accountId}, using root path`);
      return "/";
    }

    // Build the path from the account up to the root
    while (parent) {
      // If the parent is an OU (not the root), get its details and add to path
      if (parent.Type === "ORGANIZATIONAL_UNIT") {
        try {
          const ouDetails = await getOrganizationalUnitDetails(parent.Id!);
          if (ouDetails && ouDetails.Name) {
            path = `/${ouDetails.Name}${path}`;
          }
        } catch (ouError) {
          console.error(`Error getting OU details for ${parent.Id}:`, ouError);
        }
      }

      // Move up to the parent's parent
      currentId = parent.Id!;
      parent = await getParent(currentId);
    }

    // If no path was built (e.g., account directly under root), use root path
    return path || "/";
  } catch (error) {
    console.error(`Error building OU path for account ${accountId}:`, error);
    return "/";
  }
}

// Function to create a permission set in AWS SSO
export async function createPermissionSet(
  instanceArn: string,
  name: string,
  description: string,
  sessionDuration: string,
  relayState?: string,
) {
  const client = getSSOAdminClient();
  const command = new CreatePermissionSetCommand({
    InstanceArn: instanceArn,
    Name: name,
    Description: description,
    SessionDuration: sessionDuration,
    RelayState: relayState,
  });

  try {
    const response = await client.send(command);
    return response.PermissionSet;
  } catch (error) {
    console.error("Error creating permission set:", error);
    throw error;
  }
}

// Function to attach a managed policy to a permission set
export async function attachManagedPolicyToPermissionSet(
  instanceArn: string,
  permissionSetArn: string,
  managedPolicyArn: string,
) {
  const client = getSSOAdminClient();
  const command = new AttachManagedPolicyToPermissionSetCommand({
    InstanceArn: instanceArn,
    PermissionSetArn: permissionSetArn,
    ManagedPolicyArn: managedPolicyArn,
  });

  try {
    await client.send(command);
    return true;
  } catch (error) {
    console.error("Error attaching managed policy to permission set:", error);
    throw error;
  }
}

// Function to add an inline policy to a permission set
export async function putInlinePolicyToPermissionSet(
  instanceArn: string,
  permissionSetArn: string,
  inlinePolicy: string,
) {
  const client = getSSOAdminClient();
  const command = new PutInlinePolicyToPermissionSetCommand({
    InstanceArn: instanceArn,
    PermissionSetArn: permissionSetArn,
    InlinePolicy: inlinePolicy,
  });

  try {
    await client.send(command);
    return true;
  } catch (error) {
    console.error("Error adding inline policy to permission set:", error);
    throw error;
  }
}

// Function to provision a permission set to an account
export async function provisionPermissionSet(
  instanceArn: string,
  permissionSetArn: string,
  accountId: string,
  targetType = "AWS_ACCOUNT",
) {
  const client = getSSOAdminClient();
  const command = new ProvisionPermissionSetCommand({
    InstanceArn: instanceArn,
    PermissionSetArn: permissionSetArn,
    TargetId: accountId,
    TargetType: targetType,
  });

  try {
    const response = await client.send(command);
    return response;
  } catch (error) {
    console.error("Error provisioning permission set:", error);
    throw error;
  }
}

// Function to list accounts for a provisioned permission set
export async function listAccountsForPermissionSet(
  instanceArn: string,
  permissionSetArn: string,
) {
  const client = getSSOAdminClient();
  const command = new ListAccountsForProvisionedPermissionSetCommand({
    InstanceArn: instanceArn,
    PermissionSetArn: permissionSetArn,
  });

  try {
    const response = await client.send(command);
    return response.AccountIds || [];
  } catch (error) {
    console.error("Error listing accounts for permission set:", error);
    throw error;
  }
}

// Function to list all permission sets in AWS SSO
export async function listPermissionSets(instanceArn: string) {
  const client = getSSOAdminClient();
  const command = new ListPermissionSetsCommand({
    InstanceArn: instanceArn,
  });

  try {
    const response = await client.send(command);
    return response.PermissionSets || [];
  } catch (error) {
    console.error("Error listing permission sets:", error);
    throw error;
  }
}

// Function to get permission set details
export async function getPermissionSet(
  instanceArn: string,
  permissionSetArn: string,
) {
  const client = getSSOAdminClient();
  const command = new DescribePermissionSetCommand({
    InstanceArn: instanceArn,
    PermissionSetArn: permissionSetArn,
  });

  try {
    const response = await client.send(command);
    return response.PermissionSet;
  } catch (error) {
    console.error("Error getting permission set details:", error);
    throw error;
  }
}

// Function to list all managed policies attached to a permission set
export async function listManagedPoliciesForPermissionSet(
  instanceArn: string,
  permissionSetArn: string,
) {
  const client = getSSOAdminClient();
  const command = new ListManagedPoliciesInPermissionSetCommand({
    InstanceArn: instanceArn,
    PermissionSetArn: permissionSetArn,
  });

  try {
    const response = await client.send(command);
    return response.AttachedManagedPolicies || [];
  } catch (error) {
    console.error("Error listing managed policies for permission set:", error);
    throw error;
  }
}

// Function to get the inline policy for a permission set
export async function getInlinePolicyForPermissionSet(
  instanceArn: string,
  permissionSetArn: string,
) {
  const client = getSSOAdminClient();
  const command = new GetInlinePolicyForPermissionSetCommand({
    InstanceArn: instanceArn,
    PermissionSetArn: permissionSetArn,
  });

  try {
    const response = await client.send(command);
    return response.InlinePolicy;
  } catch (error) {
    console.error("Error getting inline policy for permission set:", error);
    throw error;
  }
}

// Function to detach a managed policy from a permission set
export async function detachManagedPolicyFromPermissionSet(
  instanceArn: string,
  permissionSetArn: string,
  managedPolicyArn: string,
) {
  const client = getSSOAdminClient();
  const command = new DetachManagedPolicyFromPermissionSetCommand({
    InstanceArn: instanceArn,
    PermissionSetArn: permissionSetArn,
    ManagedPolicyArn: managedPolicyArn,
  });

  try {
    await client.send(command);
    return true;
  } catch (error) {
    console.error("Error detaching managed policy from permission set:", error);
    throw error;
  }
}

// Function to delete a permission set
export async function deletePermissionSet(
  instanceArn: string,
  permissionSetArn: string,
) {
  const client = getSSOAdminClient();
  const command = new DeletePermissionSetCommand({
    InstanceArn: instanceArn,
    PermissionSetArn: permissionSetArn,
  });

  try {
    await client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting permission set:", error);
    throw error;
  }
}
