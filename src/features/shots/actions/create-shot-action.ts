"use server"

import { auth } from "@/lib/auth"
import { createShotSchema } from "@/features/shots/schemas/shot"
import { shotService } from "@/features/shots/services/shot-service"
import { canCreateShot } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"
import type { Shot } from "@/generated/prisma/client"

export async function createShotAction(
  _prevState: ActionResponse<Shot> | null,
  formData: FormData
): Promise<ActionResponse<Shot>> {
  const session = await auth()
  if (!canCreateShot(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const validated = createShotSchema.safeParse({
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || "NOT_STARTED",
    projectId: formData.get("projectId"),
  })

  if (!validated.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const shot = await shotService.createShot(validated.data)
    auditService.log("CREATE", "Shot", shot.id, session!.user!.id)
    return { success: true, data: shot as Shot }
  } catch {
    return { success: false, error: "Failed to create shot" }
  }
}
