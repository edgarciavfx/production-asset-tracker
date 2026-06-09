import prisma from "@/lib/prisma"
import type { ShotStatus } from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"
import type { CreateShotOutput, UpdateShotOutput } from "@/features/shots/schemas/shot"

export interface ListShotsParams {
  page: number
  pageSize: number
  sort: string
  order: "asc" | "desc"
  search: string
  status: ShotStatus | ""
  projectId: string
}

export interface ShotListItem {
  id: string
  code: string
  description: string | null
  status: ShotStatus
  projectId: string
  project: { id: string; name: string }
  createdAt: Date
}

export interface ListShotsResult {
  shots: ShotListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const DEFAULT_PAGE_SIZE = 10

const SORTABLE_COLUMNS = ["code", "status", "createdAt"] as const

function buildOrderBy(sort: string, order: "asc" | "desc"): Prisma.ShotOrderByWithRelationInput {
  if (SORTABLE_COLUMNS.includes(sort as (typeof SORTABLE_COLUMNS)[number])) {
    return { [sort]: order }
  }
  return { code: "asc" }
}

function buildWhereClause(params: {
  search: string
  status: ShotStatus | ""
  projectId: string
}): Prisma.ShotWhereInput {
  const where: Prisma.ShotWhereInput = { deletedAt: null }

  if (params.search) {
    where.code = { contains: params.search, mode: "insensitive" }
  }

  if (params.status) {
    where.status = params.status
  }

  if (params.projectId) {
    where.projectId = params.projectId
  }

  return where
}

export const shotService = {
  async listShots(params: Partial<ListShotsParams> = {}): Promise<ListShotsResult> {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
    const sort = params.sort ?? "code"
    const order = params.order ?? "asc"
    const search = params.search ?? ""
    const status = params.status ?? ""
    const projectId = params.projectId ?? ""

    const where = buildWhereClause({ search, status, projectId })

    const [shots, total] = await Promise.all([
      prisma.shot.findMany({
        where,
        orderBy: buildOrderBy(sort, order),
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.shot.count({ where }),
    ])

    return {
      shots: shots as ShotListItem[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  },

  async getShotById(id: string) {
    return prisma.shot.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: { id: true, name: true } },
      },
    })
  },

  async generateShotCode(projectId: string): Promise<string> {
    const last = await prisma.shot.findFirst({
      where: { projectId, code: { startsWith: "SHOT_" } },
      orderBy: { code: "desc" },
      select: { code: true },
    })
    let next = 1
    if (last?.code) {
      const m = last.code.match(/^SHOT_(\d+)$/)
      if (m) next = parseInt(m[1], 10) + 1
    }
    return `SHOT_${String(next).padStart(3, "0")}`
  },

  async createShot(data: CreateShotOutput) {
    const code = data.code ?? (await this.generateShotCode(data.projectId))
    return prisma.shot.create({
      data: {
        code,
        description: data.description ?? null,
        status: data.status as ShotStatus,
        projectId: data.projectId,
      },
    })
  },

  async updateShot(id: string, data: UpdateShotOutput) {
    return prisma.shot.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status as ShotStatus }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
      },
    })
  },

  async deleteShot(id: string) {
    const now = new Date()

    await prisma.$transaction(async (tx) => {
      await tx.comment.updateMany({
        where: { task: { shotId: id }, deletedAt: null },
        data: { deletedAt: now },
      })

      await tx.task.updateMany({
        where: { shotId: id, deletedAt: null },
        data: { deletedAt: now },
      })

      await tx.shot.update({
        where: { id },
        data: { deletedAt: now },
      })
    })
  },
}
