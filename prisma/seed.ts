import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hashSync } from "bcryptjs"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  console.log("Seeding database...")

  const adminRole = await prisma.role.create({
    data: { name: "Admin" },
  })

  await prisma.role.create({
    data: { name: "Producer" },
  })

  await prisma.role.create({
    data: { name: "Artist" },
  })

  console.log("Roles created: Admin, Producer, Artist")

  const passwordHash = hashSync("admin123", 10)

  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      passwordHash,
      roleId: adminRole.id,
    },
  })

  console.log("Admin user created: admin@example.com")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
