"use server"

import { auth } from "@/lib/auth"
import { taskService } from "@/features/tasks/services/task-service"
import { canDeleteComment } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"

export async function deleteCommentAction(
  _prevState: ActionResponse<void> | null,
  formData: FormData
): Promise<ActionResponse<void>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  if (!id) {
    return { success: false, error: "Missing comment ID" }
  }

  if (!canDeleteComment(session)) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await taskService.deleteComment(id)
    auditService.log("DELETE", "Comment", id, session.user.id)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Failed to delete comment" }
  }
}
