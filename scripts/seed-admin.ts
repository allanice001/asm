import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
	try {
		// Check if admin user already exists
		const existingAdmin = await prisma.user.findFirst({
			where: {
				role: "ADMIN",
			},
		})

		if (existingAdmin) {
			console.log("Admin user already exists:", existingAdmin.email)
			return
		}

		// Create admin user
		const hashedPassword = await hash("Admin123!", 10)
		const admin = await prisma.user.create({
			data: {
				name: "Admin User",
				email: "admin@example.com",
				password: hashedPassword,
				role: "ADMIN",
			},
		})

		console.log("Admin user created:", admin.email)
	} catch (error) {
		console.error("Error seeding admin user:", error)
	} finally {
		await prisma.$disconnect()
	}
}

main()

