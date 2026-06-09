"use server"

import { auth } from "@/lib/auth"
import { userService } from "@/features/users/services/user-service"
import { canManageUsers } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"

export async function deleteUserAction(
  _prevState: ActionResponse<void> | null,
  formData: FormData
): Promise<ActionResponse<void>> {
  const session = await auth()
  if (!canManageUsers(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  if (!id) {
    return { success: false, error: "Missing user ID" }
  }

  if (session!.user!.id === id) {
    return { success: false, error: "Cannot delete yourself" }
  }

  try {
    const existing = await userService.getUserById(id)
    if (!existing) {
      return { success: false, error: "User not found" }
    }

    await userService.deleteUser(id)
    auditService.log("DELETE", "User", id, session!.user!.id)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Failed to delete user" }
  }
}
