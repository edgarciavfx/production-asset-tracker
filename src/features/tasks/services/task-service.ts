import prisma from "@/lib/prisma"
import type { TaskStatus, TaskPriority } from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"
import type { CreateTaskOutput, UpdateTaskOutput } from "@/features/tasks/schemas/task"

export interface ListTasksParams {
  page: number
  pageSize: number
  sort: string
  order: "asc" | "desc"
  search: string
  status: TaskStatus | ""
  priority: TaskPriority | ""
  projectId: string
  assigneeId: string
}

export interface TaskListItem {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee: { id: string; name: string } | null
  project: { id: string; name: string }
  asset: { id: string; name: string } | null
  shot: { id: string; code: string } | null
  dueDate: Date | null
  createdAt: Date
}

export interface ListTasksResult {
  tasks: TaskListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CommentListItem {
  id: string
  body: string
  author: { id: string; name: string }
  createdAt: Date
}

const DEFAULT_PAGE_SIZE = 10

const SORTABLE_COLUMNS = ["title", "status", "priority", "dueDate", "createdAt"] as const

function buildOrderBy(sort: string, order: "asc" | "desc"): Prisma.TaskOrderByWithRelationInput {
  if (SORTABLE_COLUMNS.includes(sort as (typeof SORTABLE_COLUMNS)[number])) {
    return { [sort]: order }
  }
  return { createdAt: "desc" }
}

function buildWhereClause(params: {
  search: string
  status: TaskStatus | ""
  priority: TaskPriority | ""
  projectId: string
  assigneeId: string
}): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = { deletedAt: null }

  if (params.search) {
    where.title = { contains: params.search, mode: "insensitive" }
  }

  if (params.status) {
    where.status = params.status
  }

  if (params.priority) {
    where.priority = params.priority
  }

  if (params.projectId) {
    where.projectId = params.projectId
  }

  if (params.assigneeId) {
    where.assigneeId = params.assigneeId
  }

  return where
}

export const taskService = {
  async listTasks(params: Partial<ListTasksParams> = {}): Promise<ListTasksResult> {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
    const sort = params.sort ?? "createdAt"
    const order = params.order ?? "desc"
    const search = params.search ?? ""
    const status = params.status ?? ""
    const priority = params.priority ?? ""
    const projectId = params.projectId ?? ""
    const assigneeId = params.assigneeId ?? ""

    const where = buildWhereClause({ search, status, priority, projectId, assigneeId })

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: buildOrderBy(sort, order),
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          asset: { select: { id: true, name: true } },
          shot: { select: { id: true, code: true } },
        },
      }),
      prisma.task.count({ where }),
    ])

    return {
      tasks: tasks as unknown as TaskListItem[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  },

  async getTaskById(id: string) {
    return prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        asset: { select: { id: true, name: true } },
        shot: { select: { id: true, code: true } },
      },
    })
  },

  async createTask(data: CreateTaskOutput) {
    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assigneeId ?? null,
        projectId: data.projectId,
        assetId: data.assetId ?? null,
        shotId: data.shotId ?? null,
      },
    })
  },

  async updateTask(id: string, data: UpdateTaskOutput) {
    return prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status as TaskStatus }),
        ...(data.priority !== undefined && { priority: data.priority as TaskPriority }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId ?? null }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
        ...(data.assetId !== undefined && { assetId: data.assetId ?? null }),
        ...(data.shotId !== undefined && { shotId: data.shotId ?? null }),
      },
    })
  },

  async deleteTask(id: string) {
    const now = new Date()

    await prisma.$transaction(async (tx) => {
      await tx.comment.updateMany({
        where: { taskId: id, deletedAt: null },
        data: { deletedAt: now },
      })

      await tx.task.update({
        where: { id },
        data: { deletedAt: now },
      })
    })
  },

  async getComments(taskId: string): Promise<CommentListItem[]> {
    const comments = await prisma.comment.findMany({
      where: { taskId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true } },
      },
    })
    return comments as unknown as CommentListItem[]
  },

  async createComment(taskId: string, body: string, authorId: string) {
    return prisma.comment.create({
      data: { body, taskId, authorId },
    })
  },

  async deleteComment(id: string) {
    await prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  },
}
