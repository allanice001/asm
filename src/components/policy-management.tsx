"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, Edit, Trash2, History, Link } from "lucide-react"

type Policy = {
  id: string
  name: string
  description: string | null
  policyDocument: string
  type: string
  createdAt: string
  updatedAt: string
  roles: { id: string; name: string }[]
  changeHistory?: PolicyChangeHistory[]
}

type PolicyChangeHistory = {
  id: string
  policyId: string
  changeType: string
  previousState: string | null
  newState: string
  changedBy: string
  createdAt: string
}

type Role = {
  id: string
  name: string
}

export function PolicyManagement() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  const [newPolicy, setNewPolicy] = useState<Partial<Policy>>({
    name: "",
    description: "",
    policyDocument: JSON.stringify(
      {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["s3:GetObject", "s3:PutObject"],
            Resource: "arn:aws:s3:::example-bucket/*",
          },
        ],
      },
      null,
      2,
    ),
    type: "CUSTOM",
  })

  // Fetch policies and roles
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch policies
        const policiesResponse = await fetch("/api/policies")
        const policiesData = await policiesResponse.json()

        // Fetch roles
        const rolesResponse = await fetch("/api/roles")
        const rolesData = await rolesResponse.json()

        setPolicies(policiesData.policies || [])
        setRoles(rolesData.roles || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle creating or updating a policy
  const handleSavePolicy = async () => {
    try {
      if (selectedPolicy) {
        // Update existing policy
        const response = await fetch(`/api/policies/${selectedPolicy.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newPolicy,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setPolicies(policies.map((policy) => (policy.id === selectedPolicy.id ? data.policy : policy)))
        }
      } else {
        // Create new policy
        const response = await fetch("/api/policies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newPolicy,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setPolicies([...policies, data.policy])
        }
      }

      // Reset form and close dialog
      setNewPolicy({
        name: "",
        description: "",
        policyDocument: JSON.stringify(
          {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: ["s3:GetObject", "s3:PutObject"],
                Resource: "arn:aws:s3:::example-bucket/*",
              },
            ],
          },
          null,
          2,
        ),
        type: "CUSTOM",
      })
      setSelectedPolicy(null)
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving policy:", error)
    }
  }

  // Handle deleting a policy
  const handleDeletePolicy = async (id: string) => {
    if (!confirm("Are you sure you want to delete this policy? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/policies/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPolicies(policies.filter((policy) => policy.id !== id))
      }
    } catch (error) {
      console.error("Error deleting policy:", error)
    }
  }

  // Handle editing a policy
  const handleEditPolicy = (policy: Policy) => {
    setSelectedPolicy(policy)
    setNewPolicy({
      name: policy.name,
      description: policy.description || "",
      policyDocument: policy.policyDocument,
      type: policy.type,
    })
    setIsDialogOpen(true)
  }

  // Handle viewing policy history
  const handleViewHistory = async (policy: Policy) => {
    try {
      const response = await fetch(`/api/policies/${policy.id}`)
      const data = await response.json()

      setSelectedPolicy(data.policy)
      setIsHistoryDialogOpen(true)
    } catch (error) {
      console.error("Error fetching policy history:", error)
    }
  }

  // Handle attaching policy to roles
  const handleAttachToRoles = (policy: Policy) => {
    setSelectedPolicy(policy)
    setSelectedRoleIds(policy.roles.map((role) => role.id))
    setIsAttachDialogOpen(true)
  }

  // Handle saving role attachments
  const handleSaveAttachments = async () => {
    if (!selectedPolicy) return

    try {
      const response = await fetch(`/api/policies/${selectedPolicy.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedPolicy.name,
          description: selectedPolicy.description,
          policyDocument: selectedPolicy.policyDocument,
          roleIds: selectedRoleIds,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPolicies(policies.map((policy) => (policy.id === selectedPolicy.id ? data.policy : policy)))
        setIsAttachDialogOpen(false)
      }
    } catch (error) {
      console.error("Error saving policy attachments:", error)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Format JSON for display
  const formatJSON = (jsonString: string) => {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2)
    } catch {
      return jsonString
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          IAM Policies
        </CardTitle>
        <CardDescription>Manage custom IAM policies for your AWS roles</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-pulse text-muted-foreground">Loading policies...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {policies.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No policies found. Create your first one!</div>
            ) : (
              policies.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <div className="font-medium">{policy.name}</div>
                    <div className="text-sm text-muted-foreground">{policy.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Type: {policy.type} • Created: {formatDate(policy.createdAt)}
                      {policy.roles && policy.roles.length > 0 && (
                        <span> • Attached to {policy.roles.length} role(s)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAttachToRoles(policy)}
                      title="Attach to Roles"
                    >
                      <Link className="h-4 w-4" />
                      <span className="sr-only">Attach to Roles</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleViewHistory(policy)} title="View History">
                      <History className="h-4 w-4" />
                      <span className="sr-only">View History</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditPolicy(policy)} title="Edit">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePolicy(policy.id)} title="Delete">
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
              Add New Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedPolicy ? "Edit Policy" : "Create New Policy"}</DialogTitle>
              <DialogDescription>Define the IAM policy that will be attached to your roles.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Policy Name</Label>
                <Input
                  id="name"
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                  placeholder="e.g., S3ReadWriteAccess"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                  placeholder="Describe the purpose of this policy"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="policyDocument">Policy Document (JSON)</Label>
                <Textarea
                  id="policyDocument"
                  value={newPolicy.policyDocument}
                  onChange={(e) => setNewPolicy({ ...newPolicy, policyDocument: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePolicy}>{selectedPolicy ? "Save Changes" : "Create Policy"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAttachDialogOpen} onOpenChange={setIsAttachDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Attach Policy to Roles</DialogTitle>
              <DialogDescription>
                {selectedPolicy && `Select roles to attach the "${selectedPolicy.name}" policy to.`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <Label>Select Roles</Label>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={selectedRoleIds.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoleIds([...selectedRoleIds, role.id])
                          } else {
                            setSelectedRoleIds(selectedRoleIds.filter((id) => id !== role.id))
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`role-${role.id}`} className="text-sm font-normal">
                        {role.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAttachDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAttachments}>Save Attachments</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Change History</DialogTitle>
              <DialogDescription>
                {selectedPolicy && `History of changes for "${selectedPolicy.name}" policy.`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedPolicy?.changeHistory?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No change history found.</div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {selectedPolicy?.changeHistory?.map((change) => {
                    const previousState = change.previousState ? JSON.parse(change.previousState) : null
                    const newState = JSON.parse(change.newState)

                    return (
                      <div key={change.id} className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {change.changeType === "create" && <Plus className="h-4 w-4 text-green-500" />}
                            {change.changeType === "update" && <Edit className="h-4 w-4 text-amber-500" />}
                            {change.changeType === "delete" && <Trash2 className="h-4 w-4 text-red-500" />}
                            <span className="font-medium capitalize">{change.changeType}</span>
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
                                const oldValue = previousState[key]
                                const newValue = newState[key]
                                const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue)

                                if (!hasChanged) return null

                                return (
                                  <div key={key} className="text-sm">
                                    <div className="font-medium">{key}:</div>
                                    <div className="grid grid-cols-2 gap-4 mt-1">
                                      <div className="bg-red-50 p-2 rounded">
                                        <div className="text-xs text-red-500 mb-1">Removed</div>
                                        <pre className="text-xs overflow-auto">{JSON.stringify(oldValue, null, 2)}</pre>
                                      </div>
                                      <div className="bg-green-50 p-2 rounded">
                                        <div className="text-xs text-green-500 mb-1">Added</div>
                                        <pre className="text-xs overflow-auto">{JSON.stringify(newValue, null, 2)}</pre>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </TabsContent>
                            <TabsContent value="before">
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                                {previousState && previousState.policyDocument
                                  ? formatJSON(previousState.policyDocument)
                                  : JSON.stringify(previousState, null, 2)}
                              </pre>
                            </TabsContent>
                            <TabsContent value="after">
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                                {newState && newState.policyDocument
                                  ? formatJSON(newState.policyDocument)
                                  : JSON.stringify(newState, null, 2)}
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
                    )
                  })}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}

