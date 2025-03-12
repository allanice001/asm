"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Plus, Edit, Trash2, History, AlertCircle } from "lucide-react";

type PermissionSet = {
  id: string;
  name: string;
  description: string;
  sessionDuration: string;
  managedPolicies: string[];
  inlinePolicy: string;
  createdAt: string;
  updatedAt: string;
  assignments: PermissionSetAssignment[];
  changeHistory?: PermissionSetChangeHistory[];
};

type PermissionSetAssignment = {
  id: string;
  permissionSetId: string;
  accountId: string;
  status: string;
  lastDeployedAt: string | null;
  account: {
    id: string;
    name: string;
  };
};

type PermissionSetChangeHistory = {
  id: string;
  permissionSetId: string;
  changeType: string;
  previousState: string | null;
  newState: string;
  changedBy: string;
  createdAt: string;
};

type Account = {
  id: string;
  name: string;
};

export function PermissionSetManagement() {
  const [permissionSets, setPermissionSets] = useState<PermissionSet[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPermissionSet, setSelectedPermissionSet] =
    useState<PermissionSet | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  const [newPermissionSet, setNewPermissionSet] = useState<
    Partial<PermissionSet>
  >({
    name: "",
    description: "",
    sessionDuration: "PT8H",
    managedPolicies: [],
    inlinePolicy: "{}",
  });

  // Fetch permission sets and accounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch permission sets
        const permissionSetsResponse = await fetch("/api/permission-sets");
        const permissionSetsData = await permissionSetsResponse.json();

        // Fetch accounts
        const accountsResponse = await fetch("/api/accounts");
        const accountsData = await accountsResponse.json();

        setPermissionSets(permissionSetsData.permissionSets || []);
        setAccounts(accountsData.accounts || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle creating or updating a permission set
  const handleSavePermissionSet = async () => {
    try {
      if (selectedPermissionSet) {
        // Update existing permission set
        const response = await fetch(
          `/api/permission-sets/${selectedPermissionSet.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...newPermissionSet,
              changedBy: "admin@example.com", // In a real app, this would be the current user
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          setPermissionSets(
            permissionSets.map((ps) =>
              ps.id === selectedPermissionSet.id ? data.permissionSet : ps,
            ),
          );
        }
      } else {
        // Create new permission set
        const response = await fetch("/api/permission-sets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newPermissionSet,
            changedBy: "admin@example.com", // In a real app, this would be the current user
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setPermissionSets([...permissionSets, data.permissionSet]);
        }
      }

      // Reset form and close dialog
      setNewPermissionSet({
        name: "",
        description: "",
        sessionDuration: "PT8H",
        managedPolicies: [],
        inlinePolicy: "{}",
      });
      setSelectedPermissionSet(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving permission set:", error);
    }
  };

  // Handle deleting a permission set
  const handleDeletePermissionSet = async (id: string) => {
    try {
      const response = await fetch(`/api/permission-sets/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          changedBy: "admin@example.com", // In a real app, this would be the current user
        }),
      });

      if (response.ok) {
        setPermissionSets(permissionSets.filter((ps) => ps.id !== id));
      }
    } catch (error) {
      console.error("Error deleting permission set:", error);
    }
  };

  // Handle editing a permission set
  const handleEditPermissionSet = (ps: PermissionSet) => {
    setSelectedPermissionSet(ps);
    setNewPermissionSet({
      name: ps.name,
      description: ps.description,
      sessionDuration: ps.sessionDuration,
      managedPolicies: ps.managedPolicies,
      inlinePolicy: ps.inlinePolicy,
    });
    setIsDialogOpen(true);
  };

  // Handle viewing permission set history
  const handleViewHistory = async (ps: PermissionSet) => {
    try {
      const response = await fetch(`/api/permission-sets/${ps.id}`);
      const data = await response.json();

      setSelectedPermissionSet(data.permissionSet);
      setIsHistoryDialogOpen(true);
    } catch (error) {
      console.error("Error fetching permission set history:", error);
    }
  };

  // Handle managing assignments
  const handleManageAssignments = (ps: PermissionSet) => {
    setSelectedPermissionSet(ps);

    // Set initially selected accounts based on current assignments
    const currentAccountIds = ps.assignments.map((a) => a.accountId);
    setSelectedAccountIds(currentAccountIds);

    setIsAssignmentDialogOpen(true);
  };

  // Handle saving assignments
  const handleSaveAssignments = async () => {
    if (!selectedPermissionSet) return;

    try {
      const response = await fetch(
        `/api/permission-sets/${selectedPermissionSet.id}/assignments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountIds: selectedAccountIds,
          }),
        },
      );

      if (response.ok) {
        // Refresh permission sets to get updated assignments
        const permissionSetsResponse = await fetch("/api/permission-sets");
        const permissionSetsData = await permissionSetsResponse.json();
        setPermissionSets(permissionSetsData.permissionSets || []);

        setIsAssignmentDialogOpen(false);
      }
    } catch (error) {
      console.error("Error saving assignments:", error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          SSO Permission Sets
        </CardTitle>
        <CardDescription>
          Manage AWS SSO permission sets for your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-pulse text-muted-foreground">
              Loading permission sets...
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {permissionSets.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No permission sets found. Create your first one!
              </div>
            ) : (
              permissionSets.map((ps) => (
                <div
                  key={ps.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <div className="font-medium">{ps.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {ps.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Session: {ps.sessionDuration} • {ps.assignments.length}{" "}
                      assignments
                      {ps.assignments.some(
                        (a) => a.status === "out-of-sync",
                      ) && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-amber-500 border-amber-500"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Out of sync
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleManageAssignments(ps)}
                      title="Manage Assignments"
                    >
                      <Key className="h-4 w-4" />
                      <span className="sr-only">Manage Assignments</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewHistory(ps)}
                      title="View History"
                    >
                      <History className="h-4 w-4" />
                      <span className="sr-only">View History</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditPermissionSet(ps)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePermissionSet(ps.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Permission Set
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedPermissionSet
                  ? "Edit Permission Set"
                  : "Create Permission Set"}
              </DialogTitle>
              <DialogDescription>
                Define the SSO permission set that will be deployed to your AWS
                accounts.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ps-name">Name</Label>
                <Input
                  id="ps-name"
                  value={newPermissionSet.name}
                  onChange={(e) =>
                    setNewPermissionSet({
                      ...newPermissionSet,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., AdminPermissionSet"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ps-description">Description</Label>
                <Input
                  id="ps-description"
                  value={newPermissionSet.description}
                  onChange={(e) =>
                    setNewPermissionSet({
                      ...newPermissionSet,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the purpose of this permission set"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="session-duration">Session Duration</Label>
                <Select
                  value={newPermissionSet.sessionDuration}
                  onValueChange={(value) =>
                    setNewPermissionSet({
                      ...newPermissionSet,
                      sessionDuration: value,
                    })
                  }
                >
                  <SelectTrigger id="session-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PT1H">1 hour</SelectItem>
                    <SelectItem value="PT2H">2 hours</SelectItem>
                    <SelectItem value="PT4H">4 hours</SelectItem>
                    <SelectItem value="PT8H">8 hours</SelectItem>
                    <SelectItem value="PT12H">12 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>AWS Managed Policies</Label>
                <div className="space-y-2">
                  {[
                    {
                      id: "admin",
                      name: "AdministratorAccess",
                      arn: "arn:aws:iam::aws:policy/AdministratorAccess",
                    },
                    {
                      id: "readonly",
                      name: "ReadOnlyAccess",
                      arn: "arn:aws:iam::aws:policy/ReadOnlyAccess",
                    },
                    {
                      id: "poweruser",
                      name: "PowerUserAccess",
                      arn: "arn:aws:iam::aws:policy/PowerUserAccess",
                    },
                  ].map((policy) => (
                    <div
                      key={policy.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`policy-${policy.id}`}
                        checked={(
                          newPermissionSet.managedPolicies || []
                        ).includes(policy.arn)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewPermissionSet({
                              ...newPermissionSet,
                              managedPolicies: [
                                ...(newPermissionSet.managedPolicies || []),
                                policy.arn,
                              ],
                            });
                          } else {
                            setNewPermissionSet({
                              ...newPermissionSet,
                              managedPolicies: (
                                newPermissionSet.managedPolicies || []
                              ).filter((arn) => arn !== policy.arn),
                            });
                          }
                        }}
                      />
                      <Label
                        htmlFor={`policy-${policy.id}`}
                        className="text-sm font-normal"
                      >
                        {policy.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inline-policy">Inline Policy (JSON)</Label>
                <Textarea
                  id="inline-policy"
                  value={newPermissionSet.inlinePolicy}
                  onChange={(e) =>
                    setNewPermissionSet({
                      ...newPermissionSet,
                      inlinePolicy: e.target.value,
                    })
                  }
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSavePermissionSet}>
                {selectedPermissionSet
                  ? "Save Changes"
                  : "Create Permission Set"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isAssignmentDialogOpen}
          onOpenChange={setIsAssignmentDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Assignments</DialogTitle>
              <DialogDescription>
                {selectedPermissionSet &&
                  `Select accounts to assign the "${selectedPermissionSet.name}" permission set to.`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {accounts.map((account) => (
                  <div key={account.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`account-${account.id}`}
                      checked={selectedAccountIds.includes(account.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAccountIds([
                            ...selectedAccountIds,
                            account.id,
                          ]);
                        } else {
                          setSelectedAccountIds(
                            selectedAccountIds.filter(
                              (id) => id !== account.id,
                            ),
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`account-${account.id}`}
                      className="text-sm font-normal"
                    >
                      {account.name} ({account.id})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveAssignments}>Save Assignments</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isHistoryDialogOpen}
          onOpenChange={setIsHistoryDialogOpen}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Change History</DialogTitle>
              <DialogDescription>
                {selectedPermissionSet &&
                  `History of changes for "${selectedPermissionSet.name}" permission set.`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedPermissionSet?.changeHistory?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No change history found.
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {selectedPermissionSet?.changeHistory?.map((change) => {
                    const previousState = change.previousState
                      ? JSON.parse(change.previousState)
                      : null;
                    const newState = JSON.parse(change.newState);

                    return (
                      <div key={change.id} className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {change.changeType === "create" && (
                              <Plus className="h-4 w-4 text-green-500" />
                            )}
                            {change.changeType === "update" && (
                              <Edit className="h-4 w-4 text-amber-500" />
                            )}
                            {change.changeType === "delete" && (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium capitalize">
                              {change.changeType}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(change.createdAt)} by {change.changedBy}
                          </div>
                        </div>

                        {change.changeType === "update" && previousState && (
                          <Tabs defaultValue="diff">
                            <TabsList className="mb-2">
                              <TabsTrigger value="diff">Changes</TabsTrigger>
                              <TabsTrigger value="before">Before</TabsTrigger>
                              <TabsTrigger value="after">After</TabsTrigger>
                            </TabsList>
                            <TabsContent value="diff" className="space-y-2">
                              {Object.keys(newState).map((key) => {
                                const oldValue = previousState[key];
                                const newValue = newState[key];
                                const hasChanged =
                                  JSON.stringify(oldValue) !==
                                  JSON.stringify(newValue);

                                if (!hasChanged) return null;

                                return (
                                  <div key={key} className="text-sm">
                                    <div className="font-medium">{key}:</div>
                                    <div className="grid grid-cols-2 gap-4 mt-1">
                                      <div className="bg-red-50 p-2 rounded">
                                        <div className="text-xs text-red-500 mb-1">
                                          Removed
                                        </div>
                                        <pre className="text-xs overflow-auto">
                                          {JSON.stringify(oldValue, null, 2)}
                                        </pre>
                                      </div>
                                      <div className="bg-green-50 p-2 rounded">
                                        <div className="text-xs text-green-500 mb-1">
                                          Added
                                        </div>
                                        <pre className="text-xs overflow-auto">
                                          {JSON.stringify(newValue, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </TabsContent>
                            <TabsContent value="before">
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                                {JSON.stringify(previousState, null, 2)}
                              </pre>
                            </TabsContent>
                            <TabsContent value="after">
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                                {JSON.stringify(newState, null, 2)}
                              </pre>
                            </TabsContent>
                          </Tabs>
                        )}

                        {change.changeType === "create" && (
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                            {JSON.stringify(newState, null, 2)}
                          </pre>
                        )}

                        {change.changeType === "delete" && previousState && (
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                            {JSON.stringify(previousState, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsHistoryDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
