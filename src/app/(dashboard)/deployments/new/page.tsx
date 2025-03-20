"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Server, Search, X, List, FolderTree } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  OUTreeView,
  type AccountNode,
  type OUNode,
} from "@/components/ou-tree-view";
import { buildOUTree, getAllAccountIdsInOU } from "@/lib/ou-utils";

interface Account {
  id: number;
  accountId: string;
  accountName: string;
  ouPath?: string;
}

export default function NewDeploymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [deployPermissionSets, setDeployPermissionSets] = useState(true);
  const [deployPolicies, setDeployPolicies] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch("/api/accounts");
        if (!response.ok) {
          throw new Error("Failed to fetch accounts");
        }
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to fetch accounts",
          variant: "destructive",
        });
      }
    };

    fetchAccounts();
  }, [toast]);

  // Filter accounts based on search query
  const filteredAccounts = useMemo(() => {
    if (!debouncedSearchQuery) return accounts;

    return accounts.filter(
      (account) =>
        account.accountName
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()) ||
        account.accountId
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()),
    );
  }, [accounts, debouncedSearchQuery]);

  // Convert accounts to AccountNode format for the OU tree
  const accountNodes: AccountNode[] = useMemo(() => {
    return accounts.map((account) => ({
      id: account.id,
      accountId: account.accountId,
      accountName: account.accountName,
      ouPath: account.ouPath || "/",
    }));
  }, [accounts]);

  // Build the OU tree
  const ouTree = useMemo(() => {
    return buildOUTree(accountNodes);
  }, [accountNodes]);

  const handleToggleAccount = (accountId: number) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId],
    );
  };

  const handleToggleOU = (ouPath: string, accounts: AccountNode[]) => {
    // Find the OU node
    const findNode = (node: OUNode, path: string): OUNode | null => {
      if (node.path === path) return node;
      for (const child of node.children) {
        const found = findNode(child, path);
        if (found) return found;
      }
      return null;
    };

    const ouNode = findNode(ouTree, ouPath);
    if (!ouNode) return;

    // Get all account IDs in this OU and its children
    const accountIds = getAllAccountIdsInOU(ouNode);

    // Check if all accounts in this OU are already selected
    const allSelected = accountIds.every((id) =>
      selectedAccountIds.includes(id),
    );

    if (allSelected) {
      // Remove all accounts in this OU from selection
      setSelectedAccountIds((prev) =>
        prev.filter((id) => !accountIds.includes(id)),
      );
    } else {
      // Add all accounts in this OU to selection
      setSelectedAccountIds((prev) => {
        const newSelection = [...prev];
        accountIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleSelectAll = () => {
    // If search is active, only select/deselect filtered accounts
    const accountsToToggle = filteredAccounts.map((account) => account.id);

    // Check if all filtered accounts are selected
    const allFilteredSelected = accountsToToggle.every((id) =>
      selectedAccountIds.includes(id),
    );

    if (allFilteredSelected) {
      // Remove all filtered accounts from selection
      setSelectedAccountIds((prev) =>
        prev.filter((id) => !accountsToToggle.includes(id)),
      );
    } else {
      // Add all filtered accounts to selection (avoiding duplicates)
      setSelectedAccountIds((prev) => {
        const newSelection = [...prev];
        accountsToToggle.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAccountIds.length === 0) {
      toast({
        title: "No accounts selected",
        description: "Please select at least one account to deploy to.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create a deployment for each selected account
      for (const accountId of selectedAccountIds) {
        await fetch("/api/deployments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId,
            deployPermissionSets,
            deployPolicies,
          }),
        });
      }

      toast({
        title: "Deployments initiated",
        description: `Started deployments to ${selectedAccountIds.length} account(s).`,
      });

      router.push("/deployments");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create deployments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="container mx-auto max-w-3xl pb-16">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/deployments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deployments
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">New Deployment</h1>

      <form onSubmit={handleSubmit}>
        <Card className="mb-8 overflow-visible">
          <CardHeader>
            <CardTitle>Deployment Options</CardTitle>
            <CardDescription>
              Configure what resources to deploy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deployPermissionSets"
                checked={deployPermissionSets}
                onCheckedChange={(checked) =>
                  setDeployPermissionSets(!!checked)
                }
              />
              <Label htmlFor="deployPermissionSets">
                Deploy Permission Sets
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deployPolicies"
                checked={deployPolicies}
                onCheckedChange={(checked) => setDeployPolicies(!!checked)}
              />
              <Label htmlFor="deployPolicies">Deploy Policies</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Target Accounts</CardTitle>
                <CardDescription>
                  Select the accounts to deploy to
                </CardDescription>
              </div>
              <Tabs
                value={viewMode}
                onValueChange={(value) => setViewMode(value as "list" | "tree")}
              >
                <TabsList>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4 mr-2" />
                    List View
                  </TabsTrigger>
                  <TabsTrigger value="tree">
                    <FolderTree className="h-4 w-4 mr-2" />
                    OU Tree
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {viewMode === "list" &&
                filteredAccounts.length > 0 &&
                filteredAccounts.every((account) =>
                  selectedAccountIds.includes(account.id),
                )
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <div className="text-sm text-muted-foreground">
                {selectedAccountIds.length} account(s) selected
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by account name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </button>
              )}
            </div>

            {accounts.length === 0 ? (
              <p>No accounts available. Add accounts first.</p>
            ) : viewMode === "list" ? (
              // List View
              <>
                {filteredAccounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No accounts match your search criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {filteredAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-start space-x-3 p-3 border rounded-md"
                      >
                        <Checkbox
                          id={`account-${account.id}`}
                          checked={selectedAccountIds.includes(account.id)}
                          onCheckedChange={() =>
                            handleToggleAccount(account.id)
                          }
                        />
                        <div className="grid gap-1.5">
                          <label
                            htmlFor={`account-${account.id}`}
                            className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                          >
                            <Server className="h-4 w-4 text-primary" />
                            {account.accountName}
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Account ID: {account.accountId}
                          </p>
                          {account.ouPath && account.ouPath !== "/" && (
                            <p className="text-xs text-muted-foreground">
                              OU: {account.ouPath}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Tree View
              <div className="max-h-[60vh] overflow-y-auto pr-2 border rounded-md p-3">
                <OUTreeView
                  ouTree={ouTree}
                  selectedAccountIds={selectedAccountIds}
                  onToggleAccount={handleToggleAccount}
                  onToggleOU={handleToggleOU}
                  searchQuery={debouncedSearchQuery}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-4 pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/deployments")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                selectedAccountIds.length === 0 ||
                (!deployPermissionSets && !deployPolicies)
              }
            >
              {isLoading ? "Initiating Deployments..." : "Start Deployments"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
