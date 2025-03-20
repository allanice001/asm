import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function updateAdminPassword() {
	const email = process.env.ADMIN_EMAIL || "admin@example.com"
	const newPassword = process.env.NEW_PASSWORD

	if (!newPassword) {
		console.error("NEW_PASSWORD environment variable is required")
		process.exit(1)
	}

	console.log(`Updating password for ${email}...`)

	try {
		// Find the user
		const user = await prisma.user.findUnique({
			where: { email },
		})

		if (!user) {
			console.error(`User with email ${email} not found`)
			process.exit(1)
		}

		// Hash the new password
		const hashedPassword = await bcrypt.hash(newPassword, 10)

		// Update the user
		await prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashedPassword,
				updatedAt: new Date(),
			},
		})

		console.log("Password updated successfully!")
	} catch (error) {
		console.error("Error updating password:", error)
		process.exit(1)
	} finally {
		await prisma.$disconnect()
	}
}

updateAdminPassword()
	.then(() => {
		process.exit(0)
	})
	.catch((e) => {
		console.error("Update password script failed:", e)
		process.exit(1)
	})

