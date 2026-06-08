"use server"

import { auth } from "@/lib/auth"
import { createProjectSchema } from "@/features/projects/schemas/project"
import { projectService } from "@/features/projects/services/project-service"
import { canCreateProject } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"
import type { Project } from "@/generated/prisma/client"

export async function createProjectAction(
  _prevState: ActionResponse<Project> | null,
  formData: FormData
): Promise<ActionResponse<Project>> {
  const session = await auth()
  if (!canCreateProject(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const validated = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    status: formData.get("status") || "ACTIVE",
    startDate: formData.get("startDate") || null,
    endDate: formData.get("endDate") || null,
  })

  if (!validated.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const project = await projectService.createProject(validated.data)
    auditService.log("CREATE", "Project", project.id, session!.user!.id)
    return { success: true, data: project as Project }
  } catch {
    return { success: false, error: "Failed to create project" }
  }
}
