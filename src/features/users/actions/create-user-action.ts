"use server"

import { auth } from "@/lib/auth"
import { createUserSchema } from "@/features/users/schemas/user"
import { userService } from "@/features/users/services/user-service"
import { canManageUsers } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"
import type { User } from "@/generated/prisma/client"

export async function createUserAction(
  _prevState: ActionResponse<User> | null,
  formData: FormData
): Promise<ActionResponse<User>> {
  const session = await auth()
  if (!canManageUsers(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const validated = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
  })

  if (!validated.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const existing = await userService.getUserByEmail(validated.data.email)
    if (existing) {
      return { success: false, error: "A user with this email already exists" }
    }

    const user = await userService.createUser(validated.data)
    auditService.log("CREATE", "User", user.id, session!.user!.id)
    return { success: true, data: user as User }
  } catch {
    return { success: false, error: "Failed to create user" }
  }
}
