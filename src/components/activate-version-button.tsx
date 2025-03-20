"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Check } from "lucide-react"

interface ActivateVersionButtonProps {
	policyId: string
	versionId: string
}

export function ActivateVersionButton({ policyId, versionId }: ActivateVersionButtonProps) {
	const router = useRouter()
	const { toast } = useToast()
	const [isOpen, setIsOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	const handleActivate = async () => {
		setIsLoading(true)

		try {
			const response = await fetch(`/api/policies/${policyId}/versions/${versionId}/activate`, {
				method: "POST",
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to activate version")
			}

			toast({
				title: "Version activated",
				description: "The policy version has been activated successfully.",
			})

			router.refresh()
			setIsOpen(false)
		} catch (error) {
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : "Failed to activate version",
				variant: "destructive",
			})
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<>
			<Button onClick={() => setIsOpen(true)}>
				<Check className="mr-2 h-4 w-4" />
				Activate Version
			</Button>

			<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Activate this version?</AlertDialogTitle>
						<AlertDialogDescription>
							This will set this version as the active version of the policy. The active version is the one that will be
							used when deploying this policy to AWS accounts.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault()
								handleActivate()
							}}
							disabled={isLoading}
						>
							{isLoading ? "Activating..." : "Activate"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

