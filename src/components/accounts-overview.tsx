"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  CheckCircle,
  AlertCircle,
  Clock,
  FolderTree,
  List,
} from "lucide-react";
import { AccountSearch } from "@/components/account-search";
import { OUTree } from "@/components/ou-tree";

type Account = {
  id: string;
  name: string;
  email: string | null;
  status: string;
  ouId: string | null;
  ouName: string | null;
  ouPath: string | null;
  lastUpdated: string;
  permissionSetAssignments: {
    id: string;
    permissionSetId: string;
    status: string;
    permissionSet: {
      id: string;
      name: string;
    };
  }[];
};

type OUNode = {
  id: string;
  name: string;
  path: string;
  children: OUNode[];
  accounts: {
    id: string;
    name: string;
  }[];
};

export function AccountsOverview() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [ouStructure, setOUStructure] = useState<OUNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOUId, setSelectedOUId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");

  useEffect(() => {
    // Fetch accounts and OU structure
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch accounts
        const accountsResponse = await fetch("/api/accounts");
        const accountsData = await accountsResponse.json();

        // Fetch OU structure
        const ouResponse = await fetch("/api/aws/organization");
        const ouData = await ouResponse.json();

        setAccounts(accountsData.accounts || []);
        setFilteredAccounts(accountsData.accounts || []);
        setOUStructure(ouData.ouStructure || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter accounts based on search query and selected OU
  useEffect(() => {
    let result = [...accounts];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (account) =>
          account.name.toLowerCase().includes(query) ||
          account.id.toLowerCase().includes(query) ||
          (account.email && account.email.toLowerCase().includes(query)) ||
          (account.ouName && account.ouName.toLowerCase().includes(query)),
      );
    }

    // Filter by selected OU
    if (selectedOUId) {
      result = result.filter((account) => account.ouId === selectedOUId);
    }

    setFilteredAccounts(result);
  }, [accounts, searchQuery, selectedOUId]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedOUId(null);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedOUId(null);
  };

  // Handle OU selection
  const handleSelectOU = (ouId: string) => {
    setSelectedOUId(ouId === selectedOUId ? null : ouId);
    setSearchQuery("");
  };

  // Handle account selection
  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId === selectedAccountId ? null : accountId);
  };

  // Calculate compliance status
  const getAccountStatus = (account: Account) => {
    if (account.permissionSetAssignments.length === 0) {
      return "pending";
    }

    if (
      account.permissionSetAssignments.some((a) => a.status === "out-of-sync")
    ) {
      return "non-compliant";
    }

    if (account.permissionSetAssignments.some((a) => a.status === "pending")) {
      return "pending";
    }

    return "compliant";
  };

  const compliantCount = filteredAccounts.filter(
    (a) => getAccountStatus(a) === "compliant",
  ).length;
  const compliancePercentage =
    filteredAccounts.length > 0
      ? Math.round((compliantCount / filteredAccounts.length) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              AWS Accounts Overview
            </CardTitle>
            <CardDescription>
              Manage roles and permissions across {accounts.length} accounts
              {filteredAccounts.length !== accounts.length &&
                ` (${filteredAccounts.length} filtered)`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "list" | "tree")}
            >
              <TabsList>
                <TabsTrigger value="list" className="flex items-center gap-1">
                  <List className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">List</span>
                </TabsTrigger>
                <TabsTrigger value="tree" className="flex items-center gap-1">
                  <FolderTree className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">OU Tree</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-pulse text-muted-foreground">
              Loading accounts...
            </div>
          </div>
        ) : (
          <>
            <AccountSearch
              onSearch={handleSearch}
              onClear={handleClearSearch}
              query={searchQuery}
            />

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Compliance Status</span>
                <span className="text-sm font-medium">
                  {compliancePercentage}%
                </span>
              </div>
              <Progress value={compliancePercentage} className="h-2" />
            </div>

            <Tabs value={viewMode} className="mt-4">
              <TabsContent value="list" className="m-0">
                <div className="space-y-4">
                  {filteredAccounts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No accounts found matching your criteria.
                    </div>
                  ) : (
                    filteredAccounts.map((account) => {
                      const status = getAccountStatus(account);

                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between border p-3 rounded-md"
                        >
                          <div>
                            <div className="font-medium">{account.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {account.id}
                            </div>
                            {account.ouName && (
                              <div className="text-xs text-muted-foreground mt-1">
                                OU: {account.ouName}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              {account.permissionSetAssignments.length}{" "}
                              permission sets assigned
                            </div>
                          </div>
                          <Badge
                            variant={
                              status === "compliant"
                                ? "default"
                                : status === "non-compliant"
                                  ? "destructive"
                                  : "outline"
                            }
                            className="flex items-center gap-1"
                          >
                            {status === "compliant" && (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            {status === "non-compliant" && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {status === "pending" && (
                              <Clock className="h-3 w-3" />
                            )}
                            {status === "compliant" && "Compliant"}
                            {status === "non-compliant" && "Out of sync"}
                            {status === "pending" && "Pending"}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tree" className="m-0">
                <div className="border rounded-md p-4">
                  {ouStructure.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No organizational units found.
                    </div>
                  ) : (
                    <OUTree
                      data={ouStructure}
                      onSelectOU={handleSelectOU}
                      onSelectAccount={handleSelectAccount}
                      selectedOUId={selectedOUId || undefined}
                      selectedAccountId={selectedAccountId || undefined}
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
