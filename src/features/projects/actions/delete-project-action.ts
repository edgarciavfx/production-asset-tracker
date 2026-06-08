"use server"

import { auth } from "@/lib/auth"
import { projectService } from "@/features/projects/services/project-service"
import { canDeleteProject } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"

export async function deleteProjectAction(
  _prevState: ActionResponse<void> | null,
  formData: FormData
): Promise<ActionResponse<void>> {
  const session = await auth()
  if (!canDeleteProject(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  if (!id) {
    return { success: false, error: "Missing project ID" }
  }

  try {
    const existing = await projectService.getProjectById(id)
    if (!existing) {
      return { success: false, error: "Project not found" }
    }

    await projectService.deleteProject(id)
    auditService.log("DELETE", "Project", id, session!.user!.id)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Failed to delete project" }
  }
}
