"use server"

import { auth } from "@/lib/auth"
import { updateUserSchema } from "@/features/users/schemas/user"
import { userService } from "@/features/users/services/user-service"
import { canManageUsers } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"
import type { User } from "@/generated/prisma/client"

export async function updateUserAction(
  _prevState: ActionResponse<User> | null,
  formData: FormData
): Promise<ActionResponse<User>> {
  const session = await auth()
  if (!canManageUsers(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  if (!id) {
    return { success: false, error: "Missing user ID" }
  }

  const validated = updateUserSchema.safeParse({
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    password: formData.get("password") || undefined,
    roleId: formData.get("roleId") || undefined,
  })

  if (!validated.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const existing = await userService.getUserById(id)
    if (!existing) {
      return { success: false, error: "User not found" }
    }

    if (validated.data.email && validated.data.email !== existing.email) {
      const emailExists = await userService.getUserByEmail(validated.data.email)
      if (emailExists) {
        return { success: false, error: "A user with this email already exists" }
      }
    }

    const user = await userService.updateUser(id, validated.data)
    auditService.log("UPDATE", "User", id, session!.user!.id)
    return { success: true, data: user as User }
  } catch {
    return { success: false, error: "Failed to update user" }
  }
}
