"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { PolicyValidator } from "@/components/policy-validator"
import { PolicyAnalyzer } from "@/components/policy-analyzer"

export default function NewPolicyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isPolicyValid, setIsPolicyValid] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    policyDocument: JSON.stringify(
      {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
            Resource: ["*"],
          },
        ],
      },
      null,
      2,
    ),
    isAwsManaged: false,
    policyArn: "",
    isAccountSpecific: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    })
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handlePolicyDocumentChange = (value: string) => {
    setFormData({
      ...formData,
      policyDocument: value,
    })
  }

  const handleApplySuggestion = (updatedPolicy: any) => {
    setFormData({
      ...formData,
      policyDocument: JSON.stringify(updatedPolicy, null, 2),
    })

    toast({
      title: "Suggestion applied",
      description: "The policy document has been updated with the suggested changes.",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate JSON policy document
      try {
        JSON.parse(formData.policyDocument)
      } catch (error) {
        throw new Error("Invalid JSON in policy document")
      }

      // Don't submit if policy is invalid and not AWS managed
      if (!formData.isAwsManaged && !isPolicyValid) {
        throw new Error("Please fix the policy validation errors before submitting")
      }

      const response = await fetch("/api/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          policyDocument: JSON.parse(formData.policyDocument),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create policy")
      }

      toast({
        title: "Policy created",
        description: "The policy has been created successfully.",
      })

      router.push("/policies")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create policy",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create Policy</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Policy Details</CardTitle>
            <CardDescription>Enter the details of the policy you want to create.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="S3ReadWriteAccess"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Allows read and write access to S3 buckets"
                value={formData.description}
                onChange={handleChange}
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isAwsManaged"
                checked={formData.isAwsManaged}
                onCheckedChange={(checked) => handleCheckboxChange("isAwsManaged", checked as boolean)}
              />
              <Label htmlFor="isAwsManaged">This is an AWS managed policy</Label>
            </div>

            {formData.isAwsManaged && (
              <div className="space-y-2">
                <Label htmlFor="policyArn">Policy ARN</Label>
                <Input
                  id="policyArn"
                  name="policyArn"
                  placeholder="arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
                  value={formData.policyArn}
                  onChange={handleChange}
                  required={formData.isAwsManaged}
                />
                <p className="text-sm text-muted-foreground">The ARN of the AWS managed policy</p>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isAccountSpecific"
                checked={formData.isAccountSpecific}
                onCheckedChange={(checked) => handleCheckboxChange("isAccountSpecific", checked as boolean)}
              />
              <Label htmlFor="isAccountSpecific">This policy is account-specific</Label>
            </div>

            {!formData.isAwsManaged && (
              <div className="space-y-2">
                <Label htmlFor="policyDocument">Policy Document</Label>
                <Textarea
                  id="policyDocument"
                  name="policyDocument"
                  value={formData.policyDocument}
                  onChange={(e) => handlePolicyDocumentChange(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  required={!formData.isAwsManaged}
                />
                <p className="text-sm text-muted-foreground">JSON policy document following the IAM policy language</p>

                <div className="space-y-4 mt-4">
                  <PolicyValidator policyDocument={formData.policyDocument} onChange={setIsPolicyValid} />

                  {isPolicyValid && formData.policyDocument && (
                    <PolicyAnalyzer
                      policyDocument={JSON.parse(formData.policyDocument)}
                      onApplySuggestion={handleApplySuggestion}
                    />
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/policies")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (!formData.isAwsManaged && !isPolicyValid)}>
              {isLoading ? "Creating..." : "Create Policy"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

