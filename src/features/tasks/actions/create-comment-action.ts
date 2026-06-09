"use server"

import { auth } from "@/lib/auth"
import { taskService } from "@/features/tasks/services/task-service"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"
import type { Comment } from "@/generated/prisma/client"

export async function createCommentAction(
  _prevState: ActionResponse<Comment> | null,
  formData: FormData
): Promise<ActionResponse<Comment>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const taskId = formData.get("taskId") as string
  const body = formData.get("body") as string

  if (!taskId) {
    return { success: false, error: "Missing task ID" }
  }

  if (!body || body.trim().length === 0) {
    return { success: false, error: "Comment body is required" }
  }

  if (body.length > 5000) {
    return { success: false, error: "Comment must be 5000 characters or less" }
  }

  try {
    const existing = await taskService.getTaskById(taskId)
    if (!existing) {
      return { success: false, error: "Task not found" }
    }

    const comment = await taskService.createComment(taskId, body.trim(), session.user.id)
    auditService.log("CREATE", "Comment", comment.id, session.user.id)
    return { success: true, data: comment as Comment }
  } catch {
    return { success: false, error: "Failed to create comment" }
  }
}
