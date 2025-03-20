"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { analyzePolicy, suggestStatementImprovements, type PolicyAnalysis } from "@/lib/policy-analyzer"
import { AlertCircle, AlertTriangle, CheckCircle, Info, Lightbulb } from "lucide-react"

interface PolicyAnalyzerProps {
	policyDocument: any
	onApplySuggestion?: (updatedPolicy: any) => void
}

export function PolicyAnalyzer({ policyDocument, onApplySuggestion }: PolicyAnalyzerProps) {
	const [analysis, setAnalysis] = useState<PolicyAnalysis | null>(null)
	const [activeTab, setActiveTab] = useState("findings")

	const runAnalysis = () => {
		try {
			const result = analyzePolicy(policyDocument)
			setAnalysis(result)
		} catch (error) {
			console.error("Error analyzing policy:", error)
		}
	}

	const getSeverityIcon = (severity: string) => {
		switch (severity) {
			case "high":
				return <AlertCircle className="h-4 w-4 text-destructive" />
			case "medium":
				return <AlertTriangle className="h-4 w-4 text-amber-500" />
			case "low":
				return <Info className="h-4 w-4 text-blue-500" />
			default:
				return <Info className="h-4 w-4 text-muted-foreground" />
		}
	}

	const getTypeColor = (type: string) => {
		switch (type) {
			case "security":
				return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
			case "best-practice":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
			case "compliance":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
			case "optimization":
				return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
		}
	}

	const getScoreColor = (score: number) => {
		if (score >= 90) return "text-green-600 dark:text-green-400"
		if (score >= 70) return "text-amber-600 dark:text-amber-400"
		return "text-red-600 dark:text-red-400"
	}

	const applyRecommendation = (finding: any) => {
		if (!onApplySuggestion) return

		// Create a deep copy of the policy document
		const updatedPolicy = JSON.parse(JSON.stringify(policyDocument))

		// Handle specific recommendations
		if (finding.message === "Missing policy version") {
			updatedPolicy.Version = "2012-10-17"
			onApplySuggestion(updatedPolicy)
			return
		}

		if (finding.message === "Outdated policy version") {
			updatedPolicy.Version = "2012-10-17"
			onApplySuggestion(updatedPolicy)
			return
		}

		// For statement-specific findings
		if (finding.affectedStatement !== undefined) {
			const statements = Array.isArray(updatedPolicy.Statement) ? updatedPolicy.Statement : [updatedPolicy.Statement]

			const statement = statements[finding.affectedStatement]

			// Handle overly permissive actions
			if (finding.message === "Overly permissive action" && statement.Action === "*") {
				// Replace with common read-only actions as a starting point
				statement.Action = [
					"s3:Get*",
					"s3:List*",
					"ec2:Describe*",
					"cloudwatch:Get*",
					"cloudwatch:List*",
					"iam:Get*",
					"iam:List*",
				]
			}

			// Handle overly permissive resources
			if (finding.message === "Overly permissive resource" && statement.Resource === "*") {
				// Suggest a placeholder ARN
				statement.Resource = ["arn:aws:s3:::example-bucket", "arn:aws:s3:::example-bucket/*"]
			}

			// Add a basic condition if missing
			if (finding.message === "Missing condition in Allow statement") {
				statement.Condition = {
					StringEquals: {
						"aws:RequestedRegion": ["us-east-1", "us-west-2"],
					},
				}
			}

			// Add a Sid if missing
			if (finding.message === "Missing Statement ID (Sid)") {
				statement.Sid = `Statement${finding.affectedStatement + 1}`
			}

			// Update the policy with modified statements
			if (Array.isArray(updatedPolicy.Statement)) {
				updatedPolicy.Statement[finding.affectedStatement] = statement
			} else {
				updatedPolicy.Statement = statement
			}

			onApplySuggestion(updatedPolicy)
		}
	}

	return (
		<div className="space-y-4">
			{!analysis && (
				<Button onClick={runAnalysis} variant="outline">
					<Lightbulb className="mr-2 h-4 w-4" />
					Analyze Policy
				</Button>
			)}

			{analysis && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Policy Analysis</CardTitle>
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">Score:</span>
								<span className={`text-lg font-bold ${getScoreColor(analysis.score)}`}>{analysis.score}/100</span>
							</div>
						</div>
						<CardDescription>{analysis.summary}</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs value={activeTab} onValueChange={setActiveTab}>
							<TabsList className="mb-4">
								<TabsTrigger value="findings">Findings ({analysis.findings.length})</TabsTrigger>
								<TabsTrigger value="recommendations">Recommendations</TabsTrigger>
								<TabsTrigger value="best-practices">Best Practices</TabsTrigger>
							</TabsList>

							<TabsContent value="findings">
								{analysis.findings.length === 0 ? (
									<Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
										<CheckCircle className="h-4 w-4 text-green-500" />
										<AlertTitle className="text-green-800 dark:text-green-300">No issues found</AlertTitle>
										<AlertDescription className="text-green-700 dark:text-green-400">
											This policy follows AWS IAM best practices.
										</AlertDescription>
									</Alert>
								) : (
									<div className="space-y-4">
										{analysis.findings.map((finding, index) => (
											<div key={index} className="border rounded-md p-4">
												<div className="flex items-start gap-3">
													<div className="mt-0.5">{getSeverityIcon(finding.severity)}</div>
													<div className="flex-1">
														<div className="flex items-center justify-between">
															<h3 className="font-medium">{finding.message}</h3>
															<Badge className={getTypeColor(finding.type)}>{finding.type.replace("-", " ")}</Badge>
														</div>
														<p className="text-sm text-muted-foreground mt-1">{finding.recommendation}</p>
														{finding.affectedStatement !== undefined && (
															<p className="text-xs text-muted-foreground mt-1">
																Statement: {finding.affectedStatement}
															</p>
														)}
														{onApplySuggestion && (
															<Button
																size="sm"
																variant="outline"
																className="mt-2"
																onClick={() => applyRecommendation(finding)}
															>
																Apply Suggestion
															</Button>
														)}
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</TabsContent>

							<TabsContent value="recommendations">
								<div className="space-y-4">
									<Alert>
										<AlertTriangle className="h-4 w-4" />
										<AlertTitle>Recommendations</AlertTitle>
										<AlertDescription>
											These are suggested improvements to make your policy more secure and follow best practices.
										</AlertDescription>
									</Alert>

									{Array.isArray(policyDocument.Statement) ? (
										policyDocument.Statement.map((statement, index) => (
											<Card key={index}>
												<CardHeader>
													<CardTitle className="text-base">Statement {index + 1}</CardTitle>
													<CardDescription>
														{statement.Sid ? `ID: ${statement.Sid}` : "No Statement ID"}
													</CardDescription>
												</CardHeader>
												<CardContent>
													<div className="text-sm">
														<p className="font-medium">Current:</p>
														<pre className="bg-muted p-2 rounded-md overflow-auto text-xs mt-1 mb-3">
                              {JSON.stringify(statement, null, 2)}
                            </pre>

														<p className="font-medium">Suggestions:</p>
														<p className="mt-1">{suggestStatementImprovements(statement)}</p>
													</div>
												</CardContent>
											</Card>
										))
									) : (
										<Card>
											<CardHeader>
												<CardTitle className="text-base">Statement</CardTitle>
											</CardHeader>
											<CardContent>
												<div className="text-sm">
													<p className="font-medium">Current:</p>
													<pre className="bg-muted p-2 rounded-md overflow-auto text-xs mt-1 mb-3">
                            {JSON.stringify(policyDocument.Statement, null, 2)}
                          </pre>

													<p className="font-medium">Suggestions:</p>
													<p className="mt-1">{suggestStatementImprovements(policyDocument.Statement)}</p>
												</div>
											</CardContent>
										</Card>
									)}
								</div>
							</TabsContent>

							<TabsContent value="best-practices">
								<div className="space-y-4">
									<Alert>
										<Info className="h-4 w-4" />
										<AlertTitle>IAM Policy Best Practices</AlertTitle>
										<AlertDescription>
											Follow these best practices when creating and managing IAM policies.
										</AlertDescription>
									</Alert>

									<div className="grid gap-4 md:grid-cols-2">
										<Card>
											<CardHeader>
												<CardTitle className="text-base">Least Privilege</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-sm">
													Grant only the permissions required to perform a task. Avoid using wildcards in Actions and
													Resources.
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader>
												<CardTitle className="text-base">Use Conditions</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-sm">
													Add conditions to restrict when permissions are granted, such as source IP, time of day, or
													requiring MFA.
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader>
												<CardTitle className="text-base">Specific Resources</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-sm">
													Specify exact ARNs instead of using "*" for resources. Limit access to only what's needed.
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader>
												<CardTitle className="text-base">Use Statement IDs</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-sm">
													Add a unique Sid to each statement for better tracking, auditing, and management.
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader>
												<CardTitle className="text-base">Require MFA</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-sm">
													For sensitive operations, require MFA using the condition:{" "}
													<code>{'aws:MultiFactorAuthPresent": "true'}</code>
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader>
												<CardTitle className="text-base">Regular Review</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-sm">
													Regularly review and audit policies to remove unused permissions and ensure they follow
													current best practices.
												</p>
											</CardContent>
										</Card>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
					<CardFooter>
						<Button onClick={() => setAnalysis(null)} variant="outline">
							Close Analysis
						</Button>
					</CardFooter>
				</Card>
			)}
		</div>
	)
}

