"use client"

import { useSession } from "next-auth/react"
import { TaskStatusBadge } from "./task-status-badge"
import { TaskPriorityBadge } from "./task-priority-badge"
import { CommentList } from "./comment-list"
import { CreateCommentForm } from "./create-comment-form"
import type { TaskListItem, CommentListItem } from "@/features/tasks/services/task-service"

interface TaskDetailContentProps {
  task: TaskListItem
  comments: CommentListItem[]
}

export function TaskDetailContent({ task, comments }: TaskDetailContentProps) {
  const { data: session } = useSession()

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold">{task.title}</h1>
          <div className="flex items-center gap-2">
            <TaskPriorityBadge priority={task.priority} />
            <TaskStatusBadge status={task.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Project:</span>{" "}
            <span>{task.project.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Assignee:</span>{" "}
            <span>{task.assignee?.name ?? "Unassigned"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Parent:</span>{" "}
            <span>
              {task.asset
                ? `Asset: ${task.asset.name}`
                : task.shot
                  ? `Shot: ${task.shot.code}`
                  : "None"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Due Date:</span>{" "}
            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span>
          </div>
        </div>

        {task.description && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
            <p className="text-sm whitespace-pre-wrap">{task.description}</p>
          </div>
        )}
      </div>

      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Comments</h2>
        <CommentList comments={comments} currentUserId={session?.user?.id} />
        <div className="mt-4">
          <CreateCommentForm taskId={task.id} />
        </div>
      </div>
    </div>
  )
}
