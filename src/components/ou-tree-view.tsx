"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, Server } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface OUNode {
  id: string;
  name: string;
  children: OUNode[];
  accounts: AccountNode[];
  path: string;
}

export interface AccountNode {
  id: number;
  accountId: string;
  accountName: string;
  ouPath: string;
}

interface OUTreeViewProps {
  ouTree: OUNode;
  selectedAccountIds: number[];
  onToggleAccount: (accountId: number) => void;
  onToggleOU: (ouPath: string, accounts: AccountNode[]) => void;
  searchQuery?: string;
  className?: string;
}

export function OUTreeView({
  ouTree,
  selectedAccountIds,
  onToggleAccount,
  onToggleOU,
  searchQuery = "",
  className,
}: OUTreeViewProps) {
  const [expandedOUs, setExpandedOUs] = useState<Record<string, boolean>>({
    [ouTree.path]: true, // Root is expanded by default
  });

  const toggleExpand = (ouPath: string) => {
    setExpandedOUs((prev) => ({
      ...prev,
      [ouPath]: !prev[ouPath],
    }));
  };

  // Check if all accounts in an OU (and its children) are selected
  const areAllAccountsInOUSelected = (node: OUNode): boolean => {
    // Direct accounts in this OU
    const directAccountsSelected = node.accounts.every((account) =>
      selectedAccountIds.includes(account.id),
    );

    // Accounts in child OUs
    const childOUsAccountsSelected = node.children.every((childOU) =>
      areAllAccountsInOUSelected(childOU),
    );

    // If there are no accounts in this OU or its children, return false
    if (node.accounts.length === 0 && node.children.length === 0) {
      return false;
    }

    return directAccountsSelected && childOUsAccountsSelected;
  };

  // Get all account IDs in an OU and its children
  const getAllAccountIdsInOU = (node: OUNode): number[] => {
    const directAccountIds = node.accounts.map((account) => account.id);
    const childOUAccountIds = node.children.flatMap((childOU) =>
      getAllAccountIdsInOU(childOU),
    );

    return [...directAccountIds, ...childOUAccountIds];
  };

  // Handle toggling an entire OU
  const handleToggleOU = (node: OUNode) => {
    const accountsInOU = getAllAccountIdsInOU(node);
    onToggleOU(node.path, node.accounts);
  };

  // Check if node matches search query
  const nodeMatchesSearch = (node: OUNode): boolean => {
    if (!searchQuery) return true;

    const lowerQuery = searchQuery.toLowerCase();

    // Check if this OU matches
    if (node.name.toLowerCase().includes(lowerQuery)) return true;

    // Check if any direct accounts match
    if (
      node.accounts.some(
        (account) =>
          account.accountName.toLowerCase().includes(lowerQuery) ||
          account.accountId.toLowerCase().includes(lowerQuery),
      )
    )
      return true;

    // Check if any child OUs match
    if (node.children.some((childOU) => nodeMatchesSearch(childOU)))
      return true;

    return false;
  };

  // Recursively render the OU tree
  const renderOUNode = (node: OUNode, level = 0) => {
    // Skip rendering if nothing matches the search query
    if (searchQuery && !nodeMatchesSearch(node)) return null;

    const isExpanded = expandedOUs[node.path] || false;
    const isOUSelected = areAllAccountsInOUSelected(node);
    const hasMatchingAccounts = node.accounts.some(
      (account) =>
        !searchQuery ||
        account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.accountId.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
      <div key={node.path} className="w-full">
        {/* OU Node */}
        <div
          className={cn(
            "flex items-center py-1 hover:bg-muted/50 rounded-md",
            level > 0 && "ml-6",
          )}
        >
          <button
            type="button"
            onClick={() => toggleExpand(node.path)}
            className="mr-1 p-1 hover:bg-muted rounded-sm"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {node.children.length > 0 || node.accounts.length > 0 ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <span className="w-4" />
            )}
          </button>

          <Checkbox
            id={`ou-${node.id}`}
            checked={isOUSelected}
            onCheckedChange={() => handleToggleOU(node)}
            className="mr-2"
          />

          <label
            htmlFor={`ou-${node.id}`}
            className="flex items-center gap-2 cursor-pointer text-sm font-medium"
          >
            <Folder className="h-4 w-4 text-primary" />
            {node.name}
            {(node.accounts.length > 0 || node.children.length > 0) && (
              <span className="text-xs text-muted-foreground">
                ({node.accounts.length} account
                {node.accounts.length !== 1 ? "s" : ""})
              </span>
            )}
          </label>
        </div>

        {/* Child content (accounts and sub-OUs) */}
        {isExpanded && (
          <div className="pl-6">
            {/* Render accounts in this OU */}
            {hasMatchingAccounts &&
              node.accounts
                .filter(
                  (account) =>
                    !searchQuery ||
                    account.accountName
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    account.accountId
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()),
                )
                .map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center py-1 hover:bg-muted/50 rounded-md"
                  >
                    <span className="w-4 mr-1" />
                    <Checkbox
                      id={`account-${account.id}`}
                      checked={selectedAccountIds.includes(account.id)}
                      onCheckedChange={() => onToggleAccount(account.id)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`account-${account.id}`}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <Server className="h-4 w-4 text-primary" />
                      {account.accountName}
                      <span className="text-xs text-muted-foreground">
                        {account.accountId}
                      </span>
                    </label>
                  </div>
                ))}

            {/* Render child OUs */}
            {node.children.map((childOU) => renderOUNode(childOU, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-1", className)}>{renderOUNode(ouTree)}</div>
  );
}
