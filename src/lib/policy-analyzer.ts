// Types for policy analysis
export interface PolicyAnalysisResult {
	severity: "high" | "medium" | "low" | "info"
	message: string
	recommendation: string
	affectedStatement?: number
	type: "security" | "best-practice" | "compliance" | "optimization"
}

export interface PolicyAnalysis {
	findings: PolicyAnalysisResult[]
	score: number // 0-100 score, higher is better
	summary: string
}

/**
 * Analyzes an IAM policy document and returns recommendations
 */
export function analyzePolicy(policyDocument: any): PolicyAnalysis {
	const findings: PolicyAnalysisResult[] = []

	// Validate policy structure
	if (!policyDocument.Version) {
		findings.push({
			severity: "medium",
			message: "Missing policy version",
			recommendation: 'Add "Version": "2012-10-17" to your policy',
			type: "best-practice",
		})
	} else if (policyDocument.Version !== "2012-10-17") {
		findings.push({
			severity: "low",
			message: "Outdated policy version",
			recommendation: 'Update to "Version": "2012-10-17"',
			type: "best-practice",
		})
	}

	// Ensure Statement is an array
	const statements = Array.isArray(policyDocument.Statement) ? policyDocument.Statement : [policyDocument.Statement]

	// Analyze each statement
	statements.forEach((statement, index) => {
		// Check for overly permissive actions
		if (statement.Action === "*" || (Array.isArray(statement.Action) && statement.Action.includes("*"))) {
			findings.push({
				severity: "high",
				message: "Overly permissive action",
				recommendation: 'Specify only the actions needed instead of using "*"',
				affectedStatement: index,
				type: "security",
			})
		}

		// Check for service-wide actions
		if (Array.isArray(statement.Action)) {
			const serviceWildcards = statement.Action.filter((action: string) => action.endsWith(":*"))

			if (serviceWildcards.length > 0) {
				findings.push({
					severity: "medium",
					message: `Service-wide permissions found: ${serviceWildcards.join(", ")}`,
					recommendation: "Specify only the actions needed instead of using service-wide wildcards",
					affectedStatement: index,
					type: "security",
				})
			}
		}

		// Check for overly permissive resources
		if (statement.Resource === "*" || (Array.isArray(statement.Resource) && statement.Resource.includes("*"))) {
			findings.push({
				severity: "high",
				message: "Overly permissive resource",
				recommendation: 'Specify only the resources needed instead of using "*"',
				affectedStatement: index,
				type: "security",
			})
		}

		// Check for missing condition
		if (statement.Effect === "Allow" && !statement.Condition) {
			findings.push({
				severity: "medium",
				message: "Missing condition in Allow statement",
				recommendation: "Consider adding conditions to restrict when this permission is granted",
				affectedStatement: index,
				type: "best-practice",
			})
		}

		// Check for NotAction with Allow (generally not recommended)
		if (statement.Effect === "Allow" && statement.NotAction) {
			findings.push({
				severity: "medium",
				message: "Using NotAction with Allow effect",
				recommendation: "Instead of NotAction with Allow, use Action with Deny for better security",
				affectedStatement: index,
				type: "security",
			})
		}

		// Check for NotResource with Allow (generally not recommended)
		if (statement.Effect === "Allow" && statement.NotResource) {
			findings.push({
				severity: "medium",
				message: "Using NotResource with Allow effect",
				recommendation: "Instead of NotResource with Allow, use Resource with Deny for better security",
				affectedStatement: index,
				type: "security",
			})
		}

		// Check for missing Sid (Statement ID)
		if (!statement.Sid) {
			findings.push({
				severity: "low",
				message: "Missing Statement ID (Sid)",
				recommendation: "Add a unique Sid to each statement for better tracking and management",
				affectedStatement: index,
				type: "best-practice",
			})
		}
	})

	// Check for IAM best practices
	if (!findings.some((f) => f.message.includes("MFA"))) {
		const hasMfaCondition = statements.some(
			(statement) =>
				statement.Condition &&
				statement.Condition["Bool"] &&
				statement.Condition["Bool"]["aws:MultiFactorAuthPresent"] === "true",
		)

		if (
			!hasMfaCondition &&
			statements.some(
				(s) =>
					s.Action &&
					(typeof s.Action === "string" ? s.Action.includes("iam:") : s.Action.some((a: string) => a.includes("iam:"))),
			)
		) {
			findings.push({
				severity: "medium",
				message: "IAM actions without MFA requirement",
				recommendation:
					'Add a condition to require MFA for IAM actions: "Condition": {"Bool": {"aws:MultiFactorAuthPresent": "true"}}',
				type: "security",
			})
		}
	}

	// Calculate score based on findings
	const highSeverityCount = findings.filter((f) => f.severity === "high").length
	const mediumSeverityCount = findings.filter((f) => f.severity === "medium").length
	const lowSeverityCount = findings.filter((f) => f.severity === "low").length

	// Base score of 100, deduct points based on severity
	let score = 100
	score -= highSeverityCount * 20
	score -= mediumSeverityCount * 10
	score -= lowSeverityCount * 5

	// Ensure score is between 0 and 100
	score = Math.max(0, Math.min(100, score))

	// Generate summary
	let summary = ""
	if (findings.length === 0) {
		summary = "No issues found. The policy follows best practices."
	} else {
		const securityIssues = findings.filter((f) => f.type === "security").length
		const bestPracticeIssues = findings.filter((f) => f.type === "best-practice").length
		const otherIssues = findings.length - securityIssues - bestPracticeIssues

		summary = `Found ${findings.length} issue${findings.length !== 1 ? "s" : ""}: `
		summary += `${securityIssues} security, ${bestPracticeIssues} best practice`
		if (otherIssues > 0) summary += `, ${otherIssues} other`
		summary += "."
	}

	return {
		findings,
		score,
		summary,
	}
}

/**
 * Suggests improvements to a policy statement
 */
export function suggestStatementImprovements(statement: any): string {
	let suggestion = ""

	// For overly permissive actions
	if (statement.Action === "*") {
		suggestion += 'Consider replacing "*" with specific actions needed for this policy. '
	} else if (Array.isArray(statement.Action) && statement.Action.includes("*")) {
		suggestion += 'Remove the "*" action and specify only the actions needed. '
	}

	// For service-wide actions
	if (Array.isArray(statement.Action)) {
		const serviceWildcards = statement.Action.filter((action: string) => action.endsWith(":*"))
		if (serviceWildcards.length > 0) {
			suggestion += `Replace service wildcards (${serviceWildcards.join(", ")}) with specific actions. `
		}
	}

	// For overly permissive resources
	if (statement.Resource === "*") {
		suggestion += 'Specify the exact ARNs of resources instead of using "*". '
	} else if (Array.isArray(statement.Resource) && statement.Resource.includes("*")) {
		suggestion += 'Replace "*" with specific resource ARNs. '
	}

	// For missing conditions
	if (statement.Effect === "Allow" && !statement.Condition) {
		suggestion += "Add conditions to restrict when this permission is granted. "

		// Suggest common conditions based on the services being accessed
		if (Array.isArray(statement.Action)) {
			if (statement.Action.some((a: string) => a.startsWith("s3:"))) {
				suggestion += "For S3, consider conditions like aws:SourceIp or s3:x-amz-server-side-encryption. "
			}
			if (statement.Action.some((a: string) => a.startsWith("iam:"))) {
				suggestion += "For IAM actions, consider requiring MFA with aws:MultiFactorAuthPresent. "
			}
		}
	}

	return suggestion || "No specific improvements suggested for this statement."
}

