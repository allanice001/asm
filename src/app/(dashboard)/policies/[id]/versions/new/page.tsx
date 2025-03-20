"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"

interface NewPolicyVersionProps {
	params: { id: string }
}

export default function NewPolicyVersionPage({ params }: NewPolicyVersionProps) {
	const policyId = params.id
	const router = useRouter()
	const { toast } = useToast()
	const [isLoading, setIsLoading] = useState(false)
	const [policy, setPolicy] = useState<{ name: string; policyDocument: any } | null>(null)
	const [policyDocument, setPolicyDocument] = useState<string>("")

	useEffect(() => {
		const fetchPolicy = async () => {
			try {
				const response = await fetch(`/api/policies/${policyId}`)
				if (!response.ok) {
					throw new Error("Failed to fetch policy")
				}
				const data = await response.json()
				setPolicy(data)
				setPolicyDocument(JSON.stringify(data.policyDocument, null, 2))
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			// Validate JSON policy document
			try {
				JSON.parse(policyDocument)
			} catch (error) {
				throw new Error("Invalid JSON in policy document")
			}

			const response = await fetch(`/api/policies/${policyId}/versions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					policyDocument: JSON.parse(policyDocument),
				}),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to create policy version")
			}

			toast({
				title: "Version created",
				description: "The policy version has been created successfully.",
			})

			router.push(`/policies/${policyId}/versions`)
			router.refresh()
		} catch (error) {
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : "Failed to create policy version",
				variant: "destructive",
			})
		} finally {
			setIsLoading(false)
		}
	}

	if (!policy) {
		return <div>Loading...</div>
	}

	return (
		<div className="container mx-auto max-w-3xl">
			<div className="flex items-center gap-2 mb-6">
				<Link href={`/policies/${policyId}/versions`}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Versions
					</Button>
				</Link>
			</div>

			<h1 className="text-3xl font-bold mb-2">Create New Version</h1>
			<p className="text-muted-foreground mb-6">Create a new version of {policy.name}</p>

			<form onSubmit={handleSubmit}>
				<Card>
					<CardHeader>
						<CardTitle>Policy Document</CardTitle>
						<CardDescription>Edit the JSON policy document for this version.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Label htmlFor="policyDocument">Policy Document</Label>
							<Textarea
								id="policyDocument"
								value={policyDocument}
								onChange={(e) => setPolicyDocument(e.target.value)}
								rows={20}
								className="font-mono text-sm"
								required
							/>
							<p className="text-sm text-muted-foreground">JSON policy document following the IAM policy language</p>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button type="button" variant="outline" onClick={() => router.push(`/policies/${policyId}/versions`)}>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Creating..." : "Create Version"}
						</Button>
					</CardFooter>
				</Card>
			</form>
		</div>
	)
}

