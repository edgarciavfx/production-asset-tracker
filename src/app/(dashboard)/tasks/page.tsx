import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { taskService } from "@/features/tasks/services/task-service"
import { TasksPageContent } from "@/features/tasks/components/tasks-page-content"
import prisma from "@/lib/prisma"
import type { TaskStatus, TaskPriority } from "@/generated/prisma/enums"

interface TasksPageProps {
  searchParams: Promise<{
    page?: string
    sort?: string
    order?: string
    search?: string
    status?: string
    priority?: string
    projectId?: string
    assigneeId?: string
  }>
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || "1"))
  const sort = params.sort || "createdAt"
  const order = (params.order === "desc" ? "desc" : "asc") as "asc" | "desc"
  const search = params.search || ""
  const status = (params.status || "") as TaskStatus | ""
  const priority = (params.priority || "") as TaskPriority | ""
  const projectId = params.projectId || ""
  const assigneeId = params.assigneeId || ""

  const [projects, users, result] = await Promise.all([
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    taskService.listTasks({
      page,
      sort,
      order,
      search,
      status,
      priority,
      projectId,
      assigneeId,
    }),
  ])

  return (
    <TasksPageContent
      initialData={result}
      sort={sort}
      order={order}
      search={search}
      status={status}
      priority={priority}
      projectId={projectId}
      assigneeId={assigneeId}
      projects={projects}
      users={users}
    />
  )
}
