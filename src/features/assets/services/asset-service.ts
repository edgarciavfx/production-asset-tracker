import prisma from "@/lib/prisma"
import type { AssetStatus, AssetType } from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"
import type { CreateAssetOutput, UpdateAssetOutput } from "@/features/assets/schemas/asset"

export interface ListAssetsParams {
  page: number
  pageSize: number
  sort: string
  order: "asc" | "desc"
  search: string
  status: AssetStatus | ""
  type: AssetType | ""
  projectId: string
}

export interface AssetListItem {
  id: string
  name: string
  type: AssetType
  status: AssetStatus
  projectId: string
  project: { id: string; name: string }
  createdAt: Date
}

export interface ListAssetsResult {
  assets: AssetListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const DEFAULT_PAGE_SIZE = 10

const SORTABLE_COLUMNS = ["name", "type", "status", "createdAt"] as const

function buildOrderBy(sort: string, order: "asc" | "desc"): Prisma.AssetOrderByWithRelationInput {
  if (SORTABLE_COLUMNS.includes(sort as (typeof SORTABLE_COLUMNS)[number])) {
    return { [sort]: order }
  }
  return { name: "asc" }
}

function buildWhereClause(params: {
  search: string
  status: AssetStatus | ""
  type: AssetType | ""
  projectId: string
}): Prisma.AssetWhereInput {
  const where: Prisma.AssetWhereInput = { deletedAt: null }

  if (params.search) {
    where.name = { contains: params.search, mode: "insensitive" }
  }

  if (params.status) {
    where.status = params.status
  }

  if (params.type) {
    where.type = params.type
  }

  if (params.projectId) {
    where.projectId = params.projectId
  }

  return where
}

export const assetService = {
  async listAssets(params: Partial<ListAssetsParams> = {}): Promise<ListAssetsResult> {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
    const sort = params.sort ?? "name"
    const order = params.order ?? "asc"
    const search = params.search ?? ""
    const status = params.status ?? ""
    const type = params.type ?? ""
    const projectId = params.projectId ?? ""

    const where = buildWhereClause({ search, status, type, projectId })

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy: buildOrderBy(sort, order),
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.asset.count({ where }),
    ])

    return {
      assets: assets as AssetListItem[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  },

  async getAssetById(id: string) {
    return prisma.asset.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: { id: true, name: true } },
      },
    })
  },

  async createAsset(data: CreateAssetOutput) {
    return prisma.asset.create({
      data: {
        name: data.name,
        type: data.type as AssetType,
        status: data.status as AssetStatus,
        projectId: data.projectId,
      },
    })
  },

  async updateAsset(id: string, data: UpdateAssetOutput) {
    return prisma.asset.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type as AssetType }),
        ...(data.status !== undefined && { status: data.status as AssetStatus }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
      },
    })
  },

  async deleteAsset(id: string) {
    const now = new Date()

    await prisma.$transaction(async (tx) => {
      await tx.comment.updateMany({
        where: { task: { assetId: id }, deletedAt: null },
        data: { deletedAt: now },
      })

      await tx.task.updateMany({
        where: { assetId: id, deletedAt: null },
        data: { deletedAt: now },
      })

      await tx.asset.update({
        where: { id },
        data: { deletedAt: now },
      })
    })
  },
}
