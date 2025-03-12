"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Rocket,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  InfoIcon,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Deployment = {
  id: string
  status: string
  initiatedBy: string
  createdAt: string
  updatedAt: string
  logs: string | null
  accounts: {
    id: string
    name: string
  }[]
  permissionSets: {
    id: string
    name: string
  }[]
  roles: {
    id: string
    name: string
  }[]
}

type Account = {
  id: string
  name: string
}

type PermissionSet = {
  id: string
  name: string
  assignments: {
    id: string
    accountId: string
    status: string
  }[]
}

type Role = {
  id: string
  name: string
}

type QueueStatus = {
  totalDeployments: number
  queuedDeployments: number
  inProgressDeployments: number
  estimatedTimeToCompletion: number // in minutes
}

export function DeploymentHistory() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [permissionSets, setPermissionSets] = useState<PermissionSet[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)

  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false)
  const [isQueueDialogOpen, setIsQueueDialogOpen] = useState(false)

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [selectedPermissionSetIds, setSelectedPermissionSetIds] = useState<string[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [deploymentBatchSize, setDeploymentBatchSize] = useState<number>(10)
  const [deploymentConcurrency, setDeploymentConcurrency] = useState<number>(1)

  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({})
  const [refreshInterval, setRefreshInterval] = useState<number | null>(10000) // 10 seconds

  // Fetch deployments and related data
  useEffect(() => {
    fetchData()

    // Setup refresh interval if enabled
    if (refreshInterval) {
      const intervalId = setInterval(fetchData, refreshInterval)
      return () => clearInterval(intervalId)
    }
  }, [refreshInterval])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch deployments
      const deploymentsResponse = await fetch("/api/deployments")
      const deploymentsData = await deploymentsResponse.json()

      // Fetch accounts
      const accountsResponse = await fetch("/api/accounts")
      const accountsData = await accountsResponse.json()

      // Fetch permission sets
      const permissionSetsResponse = await fetch("/api/permission-sets")
      const permissionSetsData = await permissionSetsResponse.json()

      // Fetch roles
      const rolesResponse = await fetch("/api/roles")
      const rolesData = await rolesResponse.json()

      // Fetch queue status
      const queueStatusResponse = await fetch("/api/deployments/queue")
      const queueStatusData = await queueStatusResponse.json()

      setDeployments(deploymentsData.deployments || [])
      setAccounts(accountsData.accounts || [])
      setPermissionSets(permissionSetsData.permissionSets || [])
      setRoles(rolesData.roles || [])

      if (queueStatusData.status) {
        setQueueStatus(queueStatusData.status)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 1) return "Less than a minute"
    if (minutes < 60) return `~${Math.round(minutes)} minutes`

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    return `~${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes > 0 ? `${remainingMinutes} min` : ""}`
  }

  const handleViewDeployment = (deployment: Deployment) => {
    setSelectedDeployment(deployment)
    setExpandedSteps({})
    setIsDialogOpen(true)
  }

  const handleNewDeployment = () => {
    // Reset selections
    setSelectedAccountIds([])
    setSelectedPermissionSetIds([])
    setSelectedRoleIds([])

    // Find permission sets that have out-of-sync assignments
    const outOfSyncPermissionSetIds = permissionSets
      .filter((ps) => ps.assignments.some((a) => a.status === "out-of-sync"))
      .map((ps) => ps.id)

    // Pre-select out-of-sync permission sets
    setSelectedPermissionSetIds(outOfSyncPermissionSetIds)

    // Open deployment dialog
    setIsDeployDialogOpen(true)
  }

  const handleViewQueueStatus = () => {
    setIsQueueDialogOpen(true)
  }

  const handleCreateDeployment = async () => {
    try {
      // Determine if we're deploying roles or permission sets
      const isRoleDeployment = selectedRoleIds.length > 0
      const isPermissionSetDeployment = selectedPermissionSetIds.length > 0

      if (!isRoleDeployment && !isPermissionSetDeployment) {
        console.error("No roles or permission sets selected")
        return
      }

      // For simplicity, we'll only deploy one type at a time
      // If both are selected, we'll prioritize roles
      const deploymentType = isRoleDeployment ? "ROLE" : "PERMISSION_SET"

      // Create multiple deployment requests in batches if necessary
      const totalAccounts = selectedAccountIds.length
      const resourceIds = isRoleDeployment ? selectedRoleIds : selectedPermissionSetIds

      // Process deployments in batches if there are many accounts
      for (let i = 0; i < resourceIds.length; i++) {
        const resourceId = resourceIds[i]

        // For each batch of accounts
        for (let j = 0; j < totalAccounts; j += deploymentBatchSize) {
          const accountBatch = selectedAccountIds.slice(j, j + deploymentBatchSize)

          // Create the request body
          const requestBody = {
            accountIds: accountBatch,
            type: deploymentType,
            action: "CREATE",
            concurrency: deploymentConcurrency, // Pass concurrency preference to API
          }

          // Add the appropriate ID based on deployment type
          if (deploymentType === "ROLE") {
            requestBody.roleId = resourceId
          } else {
            requestBody.permissionSetId = resourceId
          }

          // Send the deployment request
          const response = await fetch("/api/deployments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error("Deployment error:", errorData.error)
          }
        }
      }

      // Close the dialog and refresh data
      setIsDeployDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error creating deployment:", error)
    }
  }

  const toggleStepExpansion = (index: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const renderDeploymentLogs = (logs: any) => {
    if (!logs) return null

    return (
      <div className="space-y-4">
        {logs.steps?.map((step: any, index: number) => (
          <div key={index} className="border rounded-md overflow-hidden">
            <div
              className="flex items-center justify-between p-3 bg-muted cursor-pointer"
              onClick={() => toggleStepExpansion(index)}
            >
              <div className="flex items-center gap-2">
                {step.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                {step.status === "failed" && <AlertCircle className="h-4 w-4 text-red-500" />}
                {step.status === "partial" && <AlertCircle className="h-4 w-4 text-amber-500" />}
                {step.status === "in-progress" && <Clock className="h-4 w-4 text-blue-500" />}
                <span className="font-medium">{step.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    step.status === "success"
                      ? "default"
                      : step.status === "failed"
                        ? "destructive"
                        : step.status === "partial"
                          ? "outline"
                          : "secondary"
                  }
                >
                  {step.status}
                </Badge>
                {expandedSteps[index] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </div>

            {expandedSteps[index] && (
              <div className="p-3 border-t">
                {step.details && (
                  <div className="space-y-3">
                    {step.details.permissionSets && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Permission Sets</h4>
                        <div className="space-y-2">
                          {step.details.permissionSets.map((ps: any, psIndex: number) => (
                            <div key={psIndex} className="border rounded-md p-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{ps.name}</span>
                                <Badge
                                  variant={
                                    ps.status === "success"
                                      ? "default"
                                      : ps.status === "failed"
                                        ? "destructive"
                                        : "outline"
                                  }
                                >
                                  {ps.status}
                                </Badge>
                              </div>

                              {ps.error && <div className="text-sm text-red-500 mb-2">Error: {ps.error}</div>}

                              {ps.assignments && (
                                <div className="mt-2">
                                  <h5 className="text-xs font-medium mb-1">Account Assignments</h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {ps.assignments.map((assignment: any, aIndex: number) => (
                                      <div key={aIndex} className="text-xs flex items-center gap-1">
                                        {assignment.status === "success" && (
                                          <CheckCircle className="h-3 w-3 text-green-500" />
                                        )}
                                        {assignment.status === "failed" && (
                                          <AlertCircle className="h-3 w-3 text-red-500" />
                                        )}
                                        <span>
                                          {accounts.find((a) => a.id === assignment.accountId)?.name ||
                                            assignment.accountId}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {step.details.roles && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Roles</h4>
                        <div className="space-y-2">
                          {step.details.roles.map((role: any, roleIndex: number) => (
                            <div key={roleIndex} className="border rounded-md p-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{role.name}</span>
                              </div>

                              {role.accounts && (
                                <div className="mt-2">
                                  <h5 className="text-xs font-medium mb-1">Accounts</h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {role.accounts.map((account: any, aIndex: number) => (
                                      <div key={aIndex} className="text-xs flex items-center gap-1">
                                        {account.status === "success" && (
                                          <CheckCircle className="h-3 w-3 text-green-500" />
                                        )}
                                        {account.status === "failed" && (
                                          <AlertCircle className="h-3 w-3 text-red-500" />
                                        )}
                                        <span>{accounts.find((a) => a.id === account.id)?.name || account.id}</span>
                                        {account.error && <span className="text-red-500 text-xs">{account.error}</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step.error && <div className="text-sm text-red-500">Error: {step.error}</div>}
              </div>
            )}
          </div>
        ))}

        {logs.errors && logs.errors.length > 0 && (
          <div className="border border-red-200 rounded-md p-3 bg-red-50">
            <h4 className="text-sm font-medium text-red-700 mb-2">Errors</h4>
            <div className="space-y-2">
              {logs.errors.map((error: any, index: number) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-red-600">{error.step}</div>
                  <div className="text-red-500">{error.error}</div>
                  <div className="text-xs text-red-400">{formatDate(error.timestamp)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {logs.throttling && logs.throttling.length > 0 && (
          <div className="border border-amber-200 rounded-md p-3 bg-amber-50">
            <h4 className="text-sm font-medium text-amber-700 mb-2">API Throttling Detected</h4>
            <div className="space-y-2">
              {logs.throttling.map((item: any, index: number) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-amber-600">
                    {item.service} - {item.operation}
                  </div>
                  <div className="text-amber-500">
                    Retried {item.retries} times with max backoff of {item.maxBackoff}ms
                  </div>
                  <div className="text-xs text-amber-400">{formatDate(item.timestamp)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {logs.summary && (
          <div className="border rounded-md p-3 bg-muted/30">
            <h4 className="text-sm font-medium mb-2">Deployment Summary</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h5 className="text-xs font-medium">Permission Sets</h5>
                <div className="text-sm">
                  Success: {logs.summary.permissionSets.success} / {logs.summary.permissionSets.total}
                  {logs.summary.permissionSets.failed > 0 && (
                    <span className="text-red-500 ml-2">Failed: {logs.summary.permissionSets.failed}</span>
                  )}
                </div>
              </div>
              <div>
                <h5 className="text-xs font-medium">Roles</h5>
                <div className="text-sm">
                  Success: {logs.summary.roles.success} / {logs.summary.roles.total}
                  {logs.summary.roles.failed > 0 && (
                    <span className="text-red-500 ml-2">Failed: {logs.summary.roles.failed}</span>
                  )}
                </div>
              </div>
              <div>
                <h5 className="text-xs font-medium">Assignments</h5>
                <div className="text-sm">
                  Success: {logs.summary.assignments.success} / {logs.summary.assignments.total}
                  {logs.summary.assignments.failed > 0 && (
                    <span className="text-red-500 ml-2">Failed: {logs.summary.assignments.failed}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Deployment History
          </CardTitle>
          <CardDescription>Track and manage deployments to your AWS accounts</CardDescription>
        </div>
        <div className="flex gap-2">
          {queueStatus && queueStatus.queuedDeployments > 0 && (
            <Button variant="outline" onClick={handleViewQueueStatus}>
              <Clock className="h-4 w-4 mr-2" />
              Queue Status
              <Badge variant="secondary" className="ml-2">
                {queueStatus.queuedDeployments}
              </Badge>
            </Button>
          )}
          <Button onClick={handleNewDeployment}>New Deployment</Button>
        </div>
      </CardHeader>
      <CardContent>
        {queueStatus && queueStatus.queuedDeployments > 0 && (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4 mr-2" />
            <AlertDescription>
              {queueStatus.queuedDeployments} deployments in queue with {queueStatus.inProgressDeployments} currently
              processing. Estimated completion time: {formatTimeRemaining(queueStatus.estimatedTimeToCompletion)}.
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-pulse text-muted-foreground">Loading deployments...</div>
          </div>
        ) : (
          <>
            {deployments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No deployments found. Create your first deployment!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Target Accounts</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead>Initiated By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell>{formatDate(deployment.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            deployment.status === "COMPLETED"
                              ? "default"
                              : deployment.status === "FAILED"
                                ? "destructive"
                                : deployment.status === "PARTIAL"
                                  ? "outline"
                                  : "secondary"
                          }
                          className="flex w-fit items-center gap-1"
                        >
                          {deployment.status === "COMPLETED" && <CheckCircle className="h-3 w-3" />}
                          {deployment.status === "FAILED" && <AlertCircle className="h-3 w-3" />}
                          {deployment.status === "PARTIAL" && <AlertTriangle className="h-3 w-3" />}
                          {(deployment.status === "IN_PROGRESS" || deployment.status === "PENDING") && (
                            <Clock className="h-3 w-3" />
                          )}
                          {deployment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{deployment.accounts.length} accounts</TableCell>
                      <TableCell>
                        {deployment.roles.length > 0 ? `${deployment.roles.length} roles` : ""}
                        {deployment.roles.length > 0 && deployment.permissionSets.length > 0 ? ", " : ""}
                        {deployment.permissionSets.length > 0
                          ? `${deployment.permissionSets.length} permission sets`
                          : ""}
                      </TableCell>
                      <TableCell>{deployment.initiatedBy}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDeployment(deployment)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}

        {/* Deployment details dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedDeployment && (
              <>
                <DialogHeader>
                  <DialogTitle>Deployment Details</DialogTitle>
                  <DialogDescription>Deployment ID: {selectedDeployment.id}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium">Status</div>
                      <Badge
                        variant={
                          selectedDeployment.status === "COMPLETED"
                            ? "default"
                            : selectedDeployment.status === "FAILED"
                              ? "destructive"
                              : selectedDeployment.status === "PARTIAL"
                                ? "outline"
                                : "secondary"
                        }
                        className="mt-1 flex w-fit items-center gap-1"
                      >
                        {selectedDeployment.status === "COMPLETED" && <CheckCircle className="h-3 w-3" />}
                        {selectedDeployment.status === "FAILED" && <AlertCircle className="h-3 w-3" />}
                        {selectedDeployment.status === "PARTIAL" && <AlertTriangle className="h-3 w-3" />}
                        {(selectedDeployment.status === "IN_PROGRESS" || selectedDeployment.status === "PENDING") && (
                          <Clock className="h-3 w-3" />
                        )}
                        {selectedDeployment.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Timestamp</div>
                      <div className="text-sm">{formatDate(selectedDeployment.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Initiated By</div>
                      <div className="text-sm">{selectedDeployment.initiatedBy}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Resources</div>
                      <div className="text-sm">
                        {selectedDeployment.roles.length > 0 ? `${selectedDeployment.roles.length} roles` : ""}
                        {selectedDeployment.roles.length > 0 && selectedDeployment.permissionSets.length > 0
                          ? ", "
                          : ""}
                        {selectedDeployment.permissionSets.length > 0
                          ? `${selectedDeployment.permissionSets.length} permission sets`
                          : ""}
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="logs">
                    <TabsList>
                      <TabsTrigger value="logs">Deployment Logs</TabsTrigger>
                      <TabsTrigger value="resources">Resources</TabsTrigger>
                    </TabsList>
                    <TabsContent value="logs" className="mt-4">
                      {selectedDeployment.logs ? (
                        renderDeploymentLogs(JSON.parse(selectedDeployment.logs))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          No logs available for this deployment.
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="resources" className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Target Accounts</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedDeployment.accounts.map((account) => (
                              <div key={account.id} className="text-sm border rounded-md px-3 py-2">
                                {account.name} ({account.id})
                              </div>
                            ))}
                          </div>
                        </div>

                        {selectedDeployment.permissionSets.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Permission Sets</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedDeployment.permissionSets.map((ps) => (
                                <div key={ps.id} className="text-sm border rounded-md px-3 py-2">
                                  {ps.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedDeployment.roles.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Roles</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedDeployment.roles.map((role) => (
                                <div key={role.id} className="text-sm border rounded-md px-3 py-2">
                                  {role.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* New deployment dialog */}
        <Dialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Deployment</DialogTitle>
              <DialogDescription>Select resources and target accounts for deployment.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Permission Sets</Label>
                  <div className="mt-2 space-y-2 max-h-[150px] overflow-y-auto">
                    {permissionSets.map((ps) => (
                      <div key={ps.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`ps-${ps.id}`}
                          checked={selectedPermissionSetIds.includes(ps.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPermissionSetIds([...selectedPermissionSetIds, ps.id])
                            } else {
                              setSelectedPermissionSetIds(selectedPermissionSetIds.filter((id) => id !== ps.id))
                            }
                          }}
                        />
                        <Label htmlFor={`ps-${ps.id}`} className="text-sm font-normal flex items-center">
                          {ps.name}
                          {ps.assignments.some((a) => a.status === "out-of-sync") && (
                            <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Out of sync
                            </Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base">Roles</Label>
                  <div className="mt-2 space-y-2 max-h-[150px] overflow-y-auto">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={selectedRoleIds.includes(role.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRoleIds([...selectedRoleIds, role.id])
                            } else {
                              setSelectedRoleIds(selectedRoleIds.filter((id) => id !== role.id))
                            }
                          }}
                        />
                        <Label htmlFor={`role-${role.id}`} className="text-sm font-normal">
                          {role.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base">Target Accounts</Label>
                  <div className="mt-2 space-y-2 max-h-[150px] overflow-y-auto">
                    {accounts.map((account) => (
                      <div key={account.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`account-${account.id}`}
                          checked={selectedAccountIds.includes(account.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAccountIds([...selectedAccountIds, account.id])
                            } else {
                              setSelectedAccountIds(selectedAccountIds.filter((id) => id !== account.id))
                            }
                          }}
                        />
                        <Label htmlFor={`account-${account.id}`} className="text-sm font-normal">
                          {account.name} ({account.id})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-base">Deployment Options</Label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="batch-size" className="text-sm">
                        Batch Size
                      </Label>
                      <select
                        id="batch-size"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={deploymentBatchSize}
                        onChange={(e) => setDeploymentBatchSize(Number(e.target.value))}
                      >
                        <option value="5">5 accounts</option>
                        <option value="10">10 accounts</option>
                        <option value="25">25 accounts</option>
                        <option value="50">50 accounts</option>
                        <option value="100">100 accounts</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="concurrency" className="text-sm">
                        Concurrency
                      </Label>
                      <select
                        id="concurrency"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={deploymentConcurrency}
                        onChange={(e) => setDeploymentConcurrency(Number(e.target.value))}
                      >
                        <option value="1">Sequential (1)</option>
                        <option value="2">Low (2)</option>
                        <option value="5">Medium (5)</option>
                        <option value="10">High (10)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeployDialogOpen(false)} className="mr-2">
                Cancel
              </Button>
              <Button
                onClick={handleCreateDeployment}
                disabled={
                  (selectedPermissionSetIds.length === 0 && selectedRoleIds.length === 0) ||
                  selectedAccountIds.length === 0
                }
              >
                Deploy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Queue status dialog */}
        <Dialog open={isQueueDialogOpen} onOpenChange={setIsQueueDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Deployment Queue Status</DialogTitle>
              <DialogDescription>Current processing status of deployments across your AWS accounts</DialogDescription>
            </DialogHeader>
            {queueStatus && (
              <div className="py-4 space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Queue Progress</span>
                    <span className="text-sm font-medium">
                      {queueStatus.totalDeployments - queueStatus.queuedDeployments}/{queueStatus.totalDeployments}
                    </span>
                  </div>
                  <Progress
                    value={
                      ((queueStatus.totalDeployments - queueStatus.queuedDeployments) / queueStatus.totalDeployments) *
                      100
                    }
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-3">
                    <div className="text-sm font-medium">In Queue</div>
                    <div className="text-2xl font-bold">{queueStatus.queuedDeployments}</div>
                    <div className="text-xs text-muted-foreground">Awaiting processing</div>
                  </div>

                  <div className="border rounded-md p-3">
                    <div className="text-sm font-medium">Processing</div>
                    <div className="text-2xl font-bold">{queueStatus.inProgressDeployments}</div>
                    <div className="text-xs text-muted-foreground">Currently being deployed</div>
                  </div>
                </div>

                <div className="border rounded-md p-3">
                  <div className="text-sm font-medium">Estimated Completion Time</div>
                  <div className="text-2xl font-bold">{formatTimeRemaining(queueStatus.estimatedTimeToCompletion)}</div>
                  <div className="text-xs text-muted-foreground">
                    Based on current throughput and remaining deployments
                  </div>
                </div>

                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    Deployments are processed sequentially with automatic throttling protection to prevent AWS API
                    limits from being exceeded.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQueueDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

