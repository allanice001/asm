"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, AlertTriangle, Check, Loader2 } from "lucide-react"

interface PolicyVersion {
	id: string
	versionNumber: number
	policyDocument: any
	isActive: boolean
	createdAt: string
	policy: {
		id: string
		name: string
	}
	createdBy: {
		name: string
	}
}

interface ActivateVersionPageProps {
	params: {
		id: string
		versionId: string
	}
}

export default function ActivateVersionPage({ params }: ActivateVersionPageProps) {
	const policyId = params.id
	const versionId = params.versionId
	const router = useRouter()
	const { toast } = useToast()
	const [isLoading, setIsLoading] = useState(false)
	const [isActivating, setIsActivating] = useState(false)
	const [version, setVersion] = useState<PolicyVersion | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchVersion = async () => {
			setIsLoading(true)
			try {
				// Fetch the policy version details
				const response = await fetch(`/api/policies/${policyId}/versions/${versionId}`)

				if (!response.ok) {
					throw new Error("Failed to fetch policy version")
				}

				const data = await response.json()
				setVersion(data)
			} catch (error) {
				setError(error instanceof Error ? error.message : "An error occurred while fetching the policy version")
				toast({
					title: "Error",
					description: error instanceof Error ? error.message : "Failed to fetch policy version",
					variant: "destructive",
				})
			} finally {
				setIsLoading(false)
			}
		}

		fetchVersion()
	}, [policyId, versionId, toast])

	const handleActivate = async () => {
		setIsActivating(true)
		try {
			const response = await fetch(`/api/policies/${policyId}/versions/${versionId}/activate`, {
				method: "POST",
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || "Failed to activate version")
			}

			toast({
				title: "Version activated",
				description: "The policy version has been activated successfully.",
			})

			// Redirect back to the policy version details page
			router.push(`/policies/${policyId}/versions/${versionId}`)
			router.refresh()
		} catch (error) {
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : "Failed to activate version",
				variant: "destructive",
			})
		} finally {
			setIsActivating(false)
		}
	}

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-3xl py-12">
				<div className="flex justify-center items-center">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<span className="ml-2">Loading version details...</span>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="container mx-auto max-w-3xl py-6">
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
				<div className="mt-4">
					<Link href={`/policies/${policyId}/versions`}>
						<Button>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Versions
						</Button>
					</Link>
				</div>
			</div>
		)
	}

	if (!version) {
		return (
			<div className="container mx-auto max-w-3xl py-6">
				<Alert>
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>Version Not Found</AlertTitle>
					<AlertDescription>The requested policy version could not be found.</AlertDescription>
				</Alert>
				<div className="mt-4">
					<Link href={`/policies/${policyId}/versions`}>
						<Button>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Versions
						</Button>
					</Link>
				</div>
			</div>
		)
	}

	if (version.isActive) {
		return (
			<div className="container mx-auto max-w-3xl py-6">
				<Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
					<Check className="h-4 w-4 text-green-500" />
					<AlertTitle className="text-green-800 dark:text-green-300">Already Active</AlertTitle>
					<AlertDescription className="text-green-700 dark:text-green-400">
						This version is already the active version of the policy.
					</AlertDescription>
				</Alert>
				<div className="mt-4">
					<Link href={`/policies/${policyId}/versions/${versionId}`}>
						<Button>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Version Details
						</Button>
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto max-w-3xl">
			<div className="flex items-center gap-2 mb-6">
				<Link href={`/policies/${policyId}/versions/${versionId}`}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Version Details
					</Button>
				</Link>
			</div>

			<h1 className="text-3xl font-bold mb-2">Activate Policy Version</h1>
			<p className="text-muted-foreground mb-6">
				You are about to activate version {version.versionNumber} of {version.policy.name}
			</p>

			<Card className="mb-8">
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Version Details</span>
						<Badge variant="outline">v{version.versionNumber}</Badge>
					</CardTitle>
					<CardDescription>
						Created by {version.createdBy.name} on {new Date(version.createdAt).toLocaleString()}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Alert className="mb-4">
						<AlertTriangle className="h-4 w-4" />
						<AlertTitle>Activation Confirmation</AlertTitle>
						<AlertDescription>
							Activating this version will make it the current active version of the policy. The active version is the
							one that will be used when deploying this policy to AWS accounts. This action cannot be undone.
						</AlertDescription>
					</Alert>

					<div className="mt-4">
						<h3 className="text-sm font-medium mb-2">Policy Document Preview:</h3>
						<div className="max-h-60 overflow-y-auto">
              <pre className="p-4 bg-muted rounded-md overflow-auto text-sm">
                {JSON.stringify(version.policyDocument, null, 2)}
              </pre>
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex justify-between">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push(`/policies/${policyId}/versions/${versionId}`)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleActivate}
						disabled={isActivating}
						className="bg-green-600 hover:bg-green-700 text-white"
					>
						{isActivating ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Activating...
							</>
						) : (
							<>
								<Check className="mr-2 h-4 w-4" />
								Activate Version
							</>
						)}
					</Button>
				</CardFooter>
			</Card>
		</div>
	)
}

