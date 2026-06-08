import prisma from "@/lib/prisma"
import { compare } from "bcryptjs"

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  role: string
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { email, deletedAt: null },
    include: { role: true },
  })

  if (!user) return null

  const isValid = await compare(password, user.passwordHash)
  if (!isValid) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
  }
}
