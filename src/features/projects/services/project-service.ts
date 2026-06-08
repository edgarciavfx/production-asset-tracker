import prisma from "@/lib/prisma"
import type { ProjectStatus } from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"
import type { CreateProjectOutput, UpdateProjectOutput } from "@/features/projects/schemas/project"

export interface ListProjectsParams {
  page: number
  pageSize: number
  sort: string
  order: "asc" | "desc"
  search: string
  status: ProjectStatus | ""
}

export interface ProjectListItem {
  id: string
  name: string
  status: ProjectStatus
  description: string | null
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  _count: { assets: number; shots: number; tasks: number }
}

export interface ListProjectsResult {
  projects: ProjectListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const DEFAULT_PAGE_SIZE = 10

const SORTABLE_COLUMNS = ["name", "status", "createdAt", "startDate", "endDate"] as const

function buildOrderBy(sort: string, order: "asc" | "desc"): Prisma.ProjectOrderByWithRelationInput {
  if (SORTABLE_COLUMNS.includes(sort as (typeof SORTABLE_COLUMNS)[number])) {
    return { [sort]: order }
  }
  return { name: "asc" }
}

function buildWhereClause(params: {
  search: string
  status: ProjectStatus | ""
}): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = { deletedAt: null }

  if (params.search) {
    where.name = { contains: params.search, mode: "insensitive" }
  }

  if (params.status) {
    where.status = params.status
  }

  return where
}

export const projectService = {
  async listProjects(params: Partial<ListProjectsParams> = {}): Promise<ListProjectsResult> {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
    const sort = params.sort ?? "name"
    const order = params.order ?? "asc"
    const search = params.search ?? ""
    const status = params.status ?? ""

    const where = buildWhereClause({ search, status })

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: buildOrderBy(sort, order),
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { assets: true, shots: true, tasks: true } },
        },
      }),
      prisma.project.count({ where }),
    ])

    return {
      projects: projects as ProjectListItem[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  },

  async getProjectById(id: string) {
    return prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { assets: true, shots: true, tasks: true } },
      },
    })
  },

  async createProject(data: CreateProjectOutput) {
    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        status: data.status as ProjectStatus,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })
  },

  async updateProject(id: string, data: UpdateProjectOutput) {
    return prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description ?? null }),
        ...(data.status !== undefined && { status: data.status as ProjectStatus }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      },
    })
  },

  async deleteProject(id: string) {
    const now = new Date()

    await prisma.$transaction(async (tx) => {
      await tx.comment.updateMany({
        where: { task: { projectId: id }, deletedAt: null },
        data: { deletedAt: now },
      })

      await tx.task.updateMany({
        where: { projectId: id, deletedAt: null },
        data: { deletedAt: now },
      })

      await tx.shot.updateMany({
        where: { projectId: id, deletedAt: null },
        data: { deletedAt: now },
      })

      await tx.asset.updateMany({
        where: { projectId: id, deletedAt: null },
        data: { deletedAt: now },
      })

      await tx.project.update({
        where: { id },
        data: { deletedAt: now },
      })
    })
  },
}
