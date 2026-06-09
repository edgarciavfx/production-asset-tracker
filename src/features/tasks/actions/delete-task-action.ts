"use server"

import { auth } from "@/lib/auth"
import { taskService } from "@/features/tasks/services/task-service"
import { canDeleteTask } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"

export async function deleteTaskAction(
  _prevState: ActionResponse<void> | null,
  formData: FormData
): Promise<ActionResponse<void>> {
  const session = await auth()
  if (!canDeleteTask(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  if (!id) {
    return { success: false, error: "Missing task ID" }
  }

  try {
    const existing = await taskService.getTaskById(id)
    if (!existing) {
      return { success: false, error: "Task not found" }
    }

    await taskService.deleteTask(id)
    auditService.log("DELETE", "Task", id, session!.user!.id)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Failed to delete task" }
  }
}
