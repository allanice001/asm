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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Plus, Edit, Trash2, History } from "lucide-react";

type Role = {
  id: string;
  name: string;
  description: string | null;
  trustPolicy: string;
  createdAt: string;
  updatedAt: string;
  changeHistory?: RoleChangeHistory[];
};

type RoleChangeHistory = {
  id: string;
  roleId: string;
  changeType: string;
  previousState: string | null;
  newState: string;
  changedBy: string;
  createdAt: string;
};

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: "",
    description: "",
    trustPolicy: JSON.stringify(
      {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
            Action: "sts:AssumeRole",
          },
        ],
      },
      null,
      2,
    ),
  });

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/roles");
        const data = await response.json();
        setRoles(data.roles || []);
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Handle creating or updating a role
  const handleSaveRole = async () => {
    try {
      if (selectedRole) {
        // Update existing role
        const response = await fetch(`/api/roles/${selectedRole.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newRole,
            changedBy: "admin@example.com", // In a real app, this would be the current user
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setRoles(
            roles.map((role) =>
              role.id === selectedRole.id ? data.role : role,
            ),
          );
        }
      } else {
        // Create new role
        const response = await fetch("/api/roles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newRole,
            changedBy: "admin@example.com", // In a real app, this would be the current user
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setRoles([...roles, data.role]);
        }
      }

      // Reset form and close dialog
      setNewRole({
        name: "",
        description: "",
        trustPolicy: JSON.stringify(
          {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  Service: "ec2.amazonaws.com",
                },
                Action: "sts:AssumeRole",
              },
            ],
          },
          null,
          2,
        ),
      });
      setSelectedRole(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving role:", error);
    }
  };

  // Handle deleting a role
  const handleDeleteRole = async (id: string) => {
    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          changedBy: "admin@example.com", // In a real app, this would be the current user
        }),
      });

      if (response.ok) {
        setRoles(roles.filter((role) => role.id !== id));
      }
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  // Handle editing a role
  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setNewRole({
      name: role.name,
      description: role.description || "",
      trustPolicy: role.trustPolicy,
    });
    setIsDialogOpen(true);
  };

  // Handle viewing role history
  const handleViewHistory = async (role: Role) => {
    try {
      const response = await fetch(`/api/roles/${role.id}`);
      const data = await response.json();

      setSelectedRole(data.role);
      setIsHistoryDialogOpen(true);
    } catch (error) {
      console.error("Error fetching role history:", error);
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
          <Shield className="h-5 w-5" />
          IAM Roles
        </CardTitle>
        <CardDescription>
          Manage custom IAM roles for your AWS accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-pulse text-muted-foreground">
              Loading roles...
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {roles.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No roles found. Create your first one!
              </div>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <div className="font-medium">{role.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {role.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created: {formatDate(role.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewHistory(role)}
                      title="View History"
                    >
                      <History className="h-4 w-4" />
                      <span className="sr-only">View History</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditRole(role)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRole(role.id)}
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
              Add New Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedRole ? "Edit Role" : "Create New Role"}
              </DialogTitle>
              <DialogDescription>
                Define the IAM role that will be deployed to your AWS accounts.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={newRole.name}
                  onChange={(e) =>
                    setNewRole({ ...newRole, name: e.target.value })
                  }
                  placeholder="e.g., AdminAccess"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newRole.description}
                  onChange={(e) =>
                    setNewRole({ ...newRole, description: e.target.value })
                  }
                  placeholder="Describe the purpose of this role"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trustPolicy">Trust Policy (JSON)</Label>
                <Textarea
                  id="trustPolicy"
                  value={newRole.trustPolicy}
                  onChange={(e) =>
                    setNewRole({ ...newRole, trustPolicy: e.target.value })
                  }
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveRole}>
                {selectedRole ? "Save Changes" : "Create Role"}
              </Button>
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
                {selectedRole &&
                  `History of changes for "${selectedRole.name}" role.`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedRole?.changeHistory?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No change history found.
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {selectedRole?.changeHistory?.map((change) => {
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
