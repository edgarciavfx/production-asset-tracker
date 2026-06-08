"use server"

import { auth } from "@/lib/auth"
import { updateProjectSchema } from "@/features/projects/schemas/project"
import { projectService } from "@/features/projects/services/project-service"
import { canUpdateProject } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"
import type { Project } from "@/generated/prisma/client"

export async function updateProjectAction(
  _prevState: ActionResponse<Project> | null,
  formData: FormData
): Promise<ActionResponse<Project>> {
  const session = await auth()
  if (!canUpdateProject(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  if (!id) {
    return { success: false, error: "Missing project ID" }
  }

  const validated = updateProjectSchema.safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") !== undefined ? (formData.get("description") || null) : undefined,
    status: formData.get("status") || undefined,
    startDate: formData.get("startDate") !== undefined ? (formData.get("startDate") || null) : undefined,
    endDate: formData.get("endDate") !== undefined ? (formData.get("endDate") || null) : undefined,
  })

  if (!validated.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const existing = await projectService.getProjectById(id)
    if (!existing) {
      return { success: false, error: "Project not found" }
    }

    const project = await projectService.updateProject(id, validated.data)
    auditService.log("UPDATE", "Project", id, session!.user!.id)
    return { success: true, data: project as Project }
  } catch {
    return { success: false, error: "Failed to update project" }
  }
}
