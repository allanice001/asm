import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function testLogin() {
	const email = process.env.TEST_EMAIL || "admin@example.com"
	const password = process.env.TEST_PASSWORD || "Admin123!"

	console.log(`Testing login for ${email}...`)

	try {
		// Find the user
		const user = await prisma.user.findUnique({
			where: { email },
			include: {
				roles: true,
			},
		})

		if (!user) {
			console.error(`User with email ${email} not found`)
			return false
		}

		// Verify password
		if (!user.password) {
			console.error("User has no password set")
			return false
		}

		const passwordValid = await bcrypt.compare(password, user.password)
		if (!passwordValid) {
			console.error("Invalid password")
			return false
		}

		console.log("Login successful!")
		console.log("User details:")
		console.log(`- Name: ${user.name}`)
		console.log(`- Email: ${user.email}`)
		console.log(`- Roles: ${user.roles.map((r) => r.name).join(", ")}`)

		return true
	} catch (error) {
		console.error("Error testing login:", error)
		return false
	} finally {
		await prisma.$disconnect()
	}
}

testLogin()
	.then((success) => {
		process.exit(success ? 0 : 1)
	})
	.catch((e) => {
		console.error("Test login script failed:", e)
		process.exit(1)
	})

