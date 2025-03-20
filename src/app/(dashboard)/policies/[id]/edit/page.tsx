"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import { PolicyAnalyzer } from "@/components/policy-analyzer"
import { PolicyValidator } from "@/components/policy-validator"

interface EditPolicyProps {
	params: { id: string }
}

export default function EditPolicyPage({ params }: EditPolicyProps) {
	const policyId = params.id
	const router = useRouter()
	const { toast } = useToast()
	const [isLoading, setIsLoading] = useState(false)
	const [isPolicyValid, setIsPolicyValid] = useState(true)
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		policyDocument: "",
		isAwsManaged: false,
		policyArn: "",
		isAccountSpecific: false,
	})

	useEffect(() => {
		const fetchPolicy = async () => {
			try {
				const response = await fetch(`/api/policies/${policyId}`)
				if (!response.ok) {
					throw new Error("Failed to fetch policy")
				}
				const data = await response.json()
				setFormData({
					name: data.name,
					description: data.description || "",
					policyDocument: JSON.stringify(data.policyDocument, null, 2),
					isAwsManaged: data.isAwsManaged,
					policyArn: data.policyArn || "",
					isAccountSpecific: data.isAccountSpecific,
				})
			} catch (error) {
				toast({
					title: "Error",
					description: error instanceof Error ? error.message : "Failed to fetch policy",
					variant: "destructive",
				})
			}
		}

		fetchPolicy()
	}, [policyId, toast])

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

			const response = await fetch(`/api/policies/${policyId}`, {
				method: "PUT",
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
				throw new Error(error.message || "Failed to update policy")
			}

			toast({
				title: "Policy updated",
				description: "The policy has been updated successfully.",
			})

			router.push(`/policies/${policyId}`)
			router.refresh()
		} catch (error) {
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : "Failed to update policy",
				variant: "destructive",
			})
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="container mx-auto max-w-3xl">
			<div className="flex items-center gap-2 mb-6">
				<Link href={`/policies/${policyId}`}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Policy
					</Button>
				</Link>
			</div>

			<h1 className="text-3xl font-bold mb-6">Edit Policy</h1>

			<form onSubmit={handleSubmit}>
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Policy Details</CardTitle>
						<CardDescription>Update the details of this policy.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								name="name"
								value={formData.name}
								onChange={handleChange}
								required
								disabled={formData.isAwsManaged}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								name="description"
								value={formData.description}
								onChange={handleChange}
								rows={2}
								disabled={formData.isAwsManaged}
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
						<Button type="button" variant="outline" onClick={() => router.push(`/policies/${policyId}`)}>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading || (!formData.isAwsManaged && !isPolicyValid)}>
							{isLoading ? "Updating..." : "Update Policy"}
						</Button>
					</CardFooter>
				</Card>
			</form>
		</div>
	)
}

