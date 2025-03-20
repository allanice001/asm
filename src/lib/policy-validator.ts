interface ValidationResult {
	valid: boolean
	errors: string[]
	warnings: string[]
}

export function validatePolicyDocument(policyDocument: any): ValidationResult {
	const result: ValidationResult = {
		valid: true,
		errors: [],
		warnings: [],
	}

	// Check if policy document is an object
	if (typeof policyDocument !== "object" || policyDocument === null) {
		result.valid = false
		result.errors.push("Policy document must be a valid JSON object")
		return result
	}

	// Check for required fields
	if (!policyDocument.Version) {
		result.errors.push("Missing required field: Version")
		result.valid = false
	} else if (policyDocument.Version !== "2012-10-17") {
		result.warnings.push('Version should be "2012-10-17" for AWS IAM policies')
	}

	if (!policyDocument.Statement) {
		result.errors.push("Missing required field: Statement")
		result.valid = false
	} else {
		// Check if Statement is an array
		if (!Array.isArray(policyDocument.Statement)) {
			// If it's a single statement, convert to array for validation
			const statements = [policyDocument.Statement]
			validateStatements(statements, result)
			result.warnings.push("Statement should be an array, even for a single statement")
		} else {
			validateStatements(policyDocument.Statement, result)
		}
	}

	// Check for unknown top-level fields
	const knownFields = ["Version", "Statement", "Id"]
	Object.keys(policyDocument).forEach((key) => {
		if (!knownFields.includes(key)) {
			result.warnings.push(`Unknown top-level field: ${key}`)
		}
	})

	return result
}

function validateStatements(statements: any[], result: ValidationResult) {
	if (statements.length === 0) {
		result.warnings.push("Policy has no statements")
	}

	statements.forEach((statement, index) => {
		// Check for required fields in each statement
		if (!statement.Effect) {
			result.errors.push(`Statement ${index}: Missing required field: Effect`)
			result.valid = false
		} else if (!["Allow", "Deny"].includes(statement.Effect)) {
			result.errors.push(`Statement ${index}: Effect must be either "Allow" or "Deny"`)
			result.valid = false
		}

		// Check that at least one of Action, NotAction is present
		if (!statement.Action && !statement.NotAction) {
			result.errors.push(`Statement ${index}: Missing required field: Action or NotAction`)
			result.valid = false
		}

		// Check that at least one of Resource, NotResource is present
		if (!statement.Resource && !statement.NotResource) {
			result.errors.push(`Statement ${index}: Missing required field: Resource or NotResource`)
			result.valid = false
		}

		// Check Action format
		if (statement.Action) {
			validateActionOrResource(statement.Action, `Statement ${index}: Action`, result)
		}

		// Check NotAction format
		if (statement.NotAction) {
			validateActionOrResource(statement.NotAction, `Statement ${index}: NotAction`, result)
		}

		// Check Resource format
		if (statement.Resource) {
			validateActionOrResource(statement.Resource, `Statement ${index}: Resource`, result)
		}

		// Check NotResource format
		if (statement.NotResource) {
			validateActionOrResource(statement.NotResource, `Statement ${index}: NotResource`, result)
		}

		// Check for unknown fields in statement
		const knownStatementFields = [
			"Effect",
			"Action",
			"NotAction",
			"Resource",
			"NotResource",
			"Condition",
			"Sid",
			"Principal",
			"NotPrincipal",
		]
		Object.keys(statement).forEach((key) => {
			if (!knownStatementFields.includes(key)) {
				result.warnings.push(`Statement ${index}: Unknown field: ${key}`)
			}
		})
	})
}

function validateActionOrResource(value: any, prefix: string, result: ValidationResult) {
	if (typeof value === "string") {
		// Single string value is fine
	} else if (Array.isArray(value)) {
		// Check each item in the array is a string
		value.forEach((item, idx) => {
			if (typeof item !== "string") {
				result.errors.push(`${prefix}[${idx}]: Must be a string`)
				result.valid = false
			}
		})
	} else {
		result.errors.push(`${prefix}: Must be a string or array of strings`)
		result.valid = false
	}
}

