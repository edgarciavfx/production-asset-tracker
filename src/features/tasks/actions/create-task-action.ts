"use server"

import { auth } from "@/lib/auth"
import { createTaskSchema } from "@/features/tasks/schemas/task"
import { taskService } from "@/features/tasks/services/task-service"
import { canCreateTask } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"
import type { Task } from "@/generated/prisma/client"

export async function createTaskAction(
  _prevState: ActionResponse<Task> | null,
  formData: FormData
): Promise<ActionResponse<Task>> {
  const session = await auth()
  if (!canCreateTask(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const validated = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || "TODO",
    priority: formData.get("priority") || "MEDIUM",
    dueDate: formData.get("dueDate") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    projectId: formData.get("projectId"),
    assetId: formData.get("assetId") || undefined,
    shotId: formData.get("shotId") || undefined,
  })

  if (!validated.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const task = await taskService.createTask(validated.data)
    auditService.log("CREATE", "Task", task.id, session!.user!.id)
    return { success: true, data: task as Task }
  } catch {
    return { success: false, error: "Failed to create task" }
  }
}
