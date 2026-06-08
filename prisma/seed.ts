import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hashSync } from "bcryptjs"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  console.log("Seeding database...")

  await prisma.$transaction(async (tx) => {
    const adminRole = await tx.role.create({
      data: { name: "Admin" },
    })

    await tx.role.create({
      data: { name: "Producer" },
    })

    await tx.role.create({
      data: { name: "Artist" },
    })

    console.log("Roles created: Admin, Producer, Artist")

    const passwordHash = hashSync("admin123", 10)

    await tx.user.create({
      data: {
        name: "Admin User",
        email: "admin@example.com",
        passwordHash,
        roleId: adminRole.id,
      },
    })

    console.log("Admin user created: admin@example.com")
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
