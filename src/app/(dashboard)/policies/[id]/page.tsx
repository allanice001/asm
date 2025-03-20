"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Shield, Server, History, Lightbulb } from "lucide-react"
import { PolicyAnalyzer } from "@/components/policy-analyzer"

interface PolicyDetailPageProps {
  params: { id: string }
}

export default function PolicyDetailPage({ params }: PolicyDetailPageProps) {
  const [showAnalyzer, setShowAnalyzer] = useState(false)
  const policyId = params.id

  // This is a client component now, so we need to fetch the data client-side
  const [policy, setPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch policy data
  useState(() => {
    const fetchPolicy = async () => {
      try {
        const response = await fetch(`/api/policies/${policyId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch policy")
        }
        const data = await response.json()
        setPolicy(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchPolicy()
  })

  if (loading) {
    return <div>Loading...</div>
  }

  if (error || !policy) {
    return <div>Error: {error || "Policy not found"}</div>
  }

  // Get active version if not AWS managed
  const activeVersion = policy.versions?.find((v: any) => v.isActive)

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/policies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Policies
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{policy.name}</h1>
          {policy.description && <p className="text-muted-foreground">{policy.description}</p>}
        </div>
        <div className="flex gap-2">
          {!policy.isAwsManaged && (
            <Link href={`/policies/${policy.id}/versions`}>
              <Button variant="outline">
                <History className="mr-2 h-4 w-4" />
                Versions
              </Button>
            </Link>
          )}
          <Link href={`/policies/${policy.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {policy.isAwsManaged && <Badge variant="secondary">AWS Managed</Badge>}
        {policy.isAccountSpecific && <Badge variant="outline">Account Specific</Badge>}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Policy Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p>{policy.name}</p>
            </div>
            {policy.isAwsManaged && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Policy ARN</h3>
                <p className="font-mono text-sm">{policy.policyArn}</p>
              </div>
            )}
            {!policy.isAwsManaged && activeVersion && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Active Version</h3>
                <p>
                  v{activeVersion.versionNumber} (created by {activeVersion.createdBy?.name || "Unknown"})
                </p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
              <p>{new Date(policy.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
              <p>{new Date(policy.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          {!policy.isAwsManaged && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Policy Document</h3>
                <Button variant="outline" size="sm" onClick={() => setShowAnalyzer(!showAnalyzer)}>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  {showAnalyzer ? "Hide Analysis" : "Analyze Policy"}
                </Button>
              </div>
              <pre className="p-4 bg-muted rounded-md overflow-auto max-h-96 text-sm">
                {JSON.stringify(policy.policyDocument, null, 2)}
              </pre>

              {showAnalyzer && (
                <div className="mt-4">
                  <PolicyAnalyzer policyDocument={policy.policyDocument} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Permission Sets</CardTitle>
            <CardDescription>Permission sets using this policy</CardDescription>
          </CardHeader>
          <CardContent>
            {policy.permissionSets?.length === 0 ? (
              <p className="text-muted-foreground">No permission sets are using this policy.</p>
            ) : (
              <div className="space-y-3">
                {policy.permissionSets?.map((item: any) => (
                  <div key={item.permissionSetId} className="flex items-start space-x-3 p-3 border rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-medium">{item.permissionSet.name}</span>
                      </div>
                      {item.permissionSet.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.permissionSet.description}</p>
                      )}
                    </div>
                    <Link href={`/permission-sets/${item.permissionSet.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {policy.isAccountSpecific && (
          <Card>
            <CardHeader>
              <CardTitle>Account-Specific Implementations</CardTitle>
              <CardDescription>Account-specific implementations of this policy</CardDescription>
            </CardHeader>
            <CardContent>
              {policy.accountSpecific?.length === 0 ? (
                <p className="text-muted-foreground">No account-specific implementations yet.</p>
              ) : (
                <div className="space-y-3">
                  {policy.accountSpecific?.map((item: any) => (
                    <div key={item.accountId} className="flex items-start space-x-3 p-3 border rounded-md">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-primary" />
                          <span className="font-medium">{item.account.accountName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Account ID: {item.account.accountId}</p>
                      </div>
                      <Link href={`/accounts/${item.account.id}/policies/${item.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

