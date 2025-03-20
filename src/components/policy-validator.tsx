"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { validatePolicyDocument } from "@/lib/policy-validator"
import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react"

interface PolicyValidatorProps {
	policyDocument: string
	onChange?: (isValid: boolean) => void
}

export function PolicyValidator({ policyDocument, onChange }: PolicyValidatorProps) {
	const [validationResult, setValidationResult] = useState<{
		valid: boolean
		errors: string[]
		warnings: string[]
	} | null>(null)

	const handleValidate = () => {
		try {
			const parsedPolicy = JSON.parse(policyDocument)
			const result = validatePolicyDocument(parsedPolicy)
			setValidationResult(result)

			if (onChange) {
				onChange(result.valid)
			}
		} catch (error) {
			setValidationResult({
				valid: false,
				errors: [`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`],
				warnings: [],
			})

			if (onChange) {
				onChange(false)
			}
		}
	}

	return (
		<div className="space-y-4">
			<Button type="button" onClick={handleValidate} variant="outline">
				Validate Policy
			</Button>

			{validationResult && (
				<div className="space-y-2">
					{validationResult.valid ? (
						<Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
							<CheckCircle className="h-4 w-4 text-green-500" />
							<AlertTitle className="text-green-800 dark:text-green-300">Valid Policy</AlertTitle>
							<AlertDescription className="text-green-700 dark:text-green-400">
								The policy document is valid.
							</AlertDescription>
						</Alert>
					) : (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Invalid Policy</AlertTitle>
							<AlertDescription>
								Please fix the following errors:
								<ul className="list-disc pl-5 mt-2 space-y-1">
									{validationResult.errors.map((error, index) => (
										<li key={index}>{error}</li>
									))}
								</ul>
							</AlertDescription>
						</Alert>
					)}

					{validationResult.warnings.length > 0 && (
						<Alert
							variant="warning"
							className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
						>
							<AlertTriangle className="h-4 w-4 text-amber-500" />
							<AlertTitle className="text-amber-800 dark:text-amber-300">Warnings</AlertTitle>
							<AlertDescription className="text-amber-700 dark:text-amber-400">
								<ul className="list-disc pl-5 mt-2 space-y-1">
									{validationResult.warnings.map((warning, index) => (
										<li key={index}>{warning}</li>
									))}
								</ul>
							</AlertDescription>
						</Alert>
					)}
				</div>
			)}
		</div>
	)
}

