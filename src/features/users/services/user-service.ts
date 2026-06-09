import prisma from "@/lib/prisma"
import { hashSync } from "bcryptjs"
import type { CreateUserOutput, UpdateUserOutput } from "@/features/users/schemas/user"

export interface UserListItem {
  id: string
  name: string
  email: string
  role: { id: string; name: string }
  createdAt: Date
  deletedAt: Date | null
}

export interface ListUsersResult {
  users: UserListItem[]
  total: number
}

export interface RoleOption {
  id: string
  name: string
}

export const userService = {
  async listUsers(): Promise<ListUsersResult> {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { role: true },
      }),
      prisma.user.count({ where: { deletedAt: null } }),
    ])

    return { users: users as UserListItem[], total }
  },

  async getUserById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    })
  },

  async getUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, email: true },
    })
  },

  async listRoles(): Promise<RoleOption[]> {
    return prisma.role.findMany({ orderBy: { name: "asc" } })
  },

  async createUser(data: CreateUserOutput) {
    const passwordHash = hashSync(data.password, 10)

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        roleId: data.roleId,
      },
      include: { role: true },
    })
  },

  async updateUser(id: string, data: UpdateUserOutput) {
    const updateData: Record<string, string> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.password !== undefined) updateData.passwordHash = hashSync(data.password, 10)
    if (data.roleId !== undefined) updateData.roleId = data.roleId

    return prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    })
  },

  async deleteUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  },
}
