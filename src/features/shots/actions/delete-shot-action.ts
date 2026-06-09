"use server"

import { auth } from "@/lib/auth"
import { shotService } from "@/features/shots/services/shot-service"
import { canDeleteShot } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"

export async function deleteShotAction(
  _prevState: ActionResponse<void> | null,
  formData: FormData
): Promise<ActionResponse<void>> {
  const session = await auth()
  if (!canDeleteShot(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  if (!id) {
    return { success: false, error: "Missing shot ID" }
  }

  try {
    const existing = await shotService.getShotById(id)
    if (!existing) {
      return { success: false, error: "Shot not found" }
    }

    await shotService.deleteShot(id)
    auditService.log("DELETE", "Shot", id, session!.user!.id)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Failed to delete shot" }
  }
}
