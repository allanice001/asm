import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

const prisma = new PrismaClient()

async function main() {
	console.log("Starting admin user seed...")

	// Configuration - change these values as needed
	const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"
	const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!"
	const adminName = process.env.ADMIN_NAME || "System Administrator"

	try {
		// Check if admin user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: adminEmail },
		})

		if (existingUser) {
			console.log(`Admin user with email ${adminEmail} already exists. Skipping creation.`)
			return
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(adminPassword, 10)

		// Create the admin user
		const adminUser = await prisma.user.create({
			data: {
				name: adminName,
				email: adminEmail,
				password: hashedPassword
			},
		})

		console.log(`Admin user created successfully: ${adminUser.name} (${adminUser.email})`)
		return true
	} catch (error) {
		console.error("Error seeding admin user:", error)
		return false
	} finally {
		await prisma.$disconnect()
	}
}

main()
	.then(async () => {
		await prisma.$disconnect()
		process.exit(0)
	})
	.catch(async (error) => {
		console.error("Error during database seeding:", error)
		await prisma.$disconnect()
		process.exit(1)
	})

