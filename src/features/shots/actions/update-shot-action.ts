"use server"

import { auth } from "@/lib/auth"
import { updateShotSchema } from "@/features/shots/schemas/shot"
import { shotService } from "@/features/shots/services/shot-service"
import { canUpdateShot } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"
import type { Shot } from "@/generated/prisma/client"

export async function updateShotAction(
  _prevState: ActionResponse<Shot> | null,
  formData: FormData
): Promise<ActionResponse<Shot>> {
  const session = await auth()
  if (!canUpdateShot(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  if (!id) {
    return { success: false, error: "Missing shot ID" }
  }

  const validated = updateShotSchema.safeParse({
    code: formData.get("code") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status") || undefined,
    projectId: formData.get("projectId") || undefined,
  })

  if (!validated.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const existing = await shotService.getShotById(id)
    if (!existing) {
      return { success: false, error: "Shot not found" }
    }

    const shot = await shotService.updateShot(id, validated.data)
    auditService.log("UPDATE", "Shot", id, session!.user!.id)
    return { success: true, data: shot as Shot }
  } catch {
    return { success: false, error: "Failed to update shot" }
  }
}
