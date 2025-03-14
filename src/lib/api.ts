// API functions for interacting with the backend

/**
 * Fetches all users from the API
 */
export async function getUsers() {
	const response = await fetch("/api/users")
	if (!response.ok) {
		throw new Error("Failed to fetch users")
	}
	return response.json()
}

/**
 * Creates a new user
 * @param userData User data to create
 */
export async function createUser(userData: { name: string; email: string; roles: string[] }) {
	const response = await fetch("/api/users", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(userData),
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.message || "Failed to create user")
	}

	return response.json()
}

/**
 * Updates an existing user
 * @param userData User data to update
 */
export async function updateUser(userData: { id: string; name: string; email: string; roles: string[] }) {
	const response = await fetch(`/api/users/${userData.id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(userData),
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.message || "Failed to update user")
	}

	return response.json()
}

/**
 * Deletes a user
 * @param userId ID of the user to delete
 */
export async function deleteUser(userId: string) {
	const response = await fetch(`/api/users/${userId}`, {
		method: "DELETE",
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.message || "Failed to delete user")
	}

	return response.json()
}

/**
 * Fetches all roles from the API
 */
export async function getRoles() {
	const response = await fetch("/api/roles")
	if (!response.ok) {
		throw new Error("Failed to fetch roles")
	}
	return response.json()
}

/**
 * Creates a new role
 * @param roleData Role data to create
 */
export async function createRole(roleData: { name: string; description?: string; policies: string[] }) {
	const response = await fetch("/api/roles", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(roleData),
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.message || "Failed to create role")
	}

	return response.json()
}

/**
 * Updates an existing role
 * @param roleData Role data to update
 */
export async function updateRole(roleData: { id: string; name: string; description?: string; policies: string[] }) {
	const response = await fetch(`/api/roles/${roleData.id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(roleData),
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.message || "Failed to update role")
	}

	return response.json()
}

/**
 * Deletes a role
 * @param roleId ID of the role to delete
 */
export async function deleteRole(roleId: string) {
	const response = await fetch(`/api/roles/${roleId}`, {
		method: "DELETE",
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.message || "Failed to delete role")
	}

	return response.json()
}

/**
 * Fetches all permission sets from the API
 */
export async function getPermissionSets() {
	const response = await fetch("/api/permission-sets")
	if (!response.ok) {
		throw new Error("Failed to fetch permission sets")
	}
	return response.json()
}

/**
 * Fetches all accounts from the API
 */
export async function getAccounts() {
	const response = await fetch("/api/accounts")
	if (!response.ok) {
		throw new Error("Failed to fetch accounts")
	}
	return response.json()
}

