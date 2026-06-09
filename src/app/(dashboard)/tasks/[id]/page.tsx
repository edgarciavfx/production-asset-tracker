import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { taskService, type TaskListItem, type CommentListItem } from "@/features/tasks/services/task-service"
import { TaskDetailContent } from "@/features/tasks/components/task-detail-content"

interface TaskDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const [task, comments] = await Promise.all([
    taskService.getTaskById(id),
    taskService.getComments(id),
  ])

  if (!task) {
    notFound()
  }

  return (
    <TaskDetailContent
      task={task as unknown as TaskListItem}
      comments={comments as CommentListItem[]}
    />
  )
}
