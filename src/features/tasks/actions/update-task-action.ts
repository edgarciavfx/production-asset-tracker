"use server"

import { auth } from "@/lib/auth"
import { updateTaskSchema } from "@/features/tasks/schemas/task"
import { taskService } from "@/features/tasks/services/task-service"
import { canUpdateTask } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"
import type { Task } from "@/generated/prisma/client"

export async function updateTaskAction(
  _prevState: ActionResponse<Task> | null,
  formData: FormData
): Promise<ActionResponse<Task>> {
  const session = await auth()
  const id = formData.get("id") as string
  if (!id) {
    return { success: false, error: "Missing task ID" }
  }

  const validated = updateTaskSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    projectId: formData.get("projectId") || undefined,
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
    const existing = await taskService.getTaskById(id)
    if (!existing) {
      return { success: false, error: "Task not found" }
    }

    if (!canUpdateTask(session, existing.assigneeId)) {
      return { success: false, error: "Unauthorized" }
    }

    const task = await taskService.updateTask(id, validated.data)
    auditService.log("UPDATE", "Task", id, session!.user!.id)
    return { success: true, data: task as Task }
  } catch {
    return { success: false, error: "Failed to update task" }
  }
}
