import prisma from "@/lib/prisma"
import type { TaskStatus } from "@/generated/prisma/enums"

export interface DashboardMetrics {
  totalProjects: number
  totalAssets: number
  totalShots: number
  openTasks: number
  overdueTasks: number
  activeAssets: number
  activeShots: number
}

export interface StatusDistribution {
  name: string
  value: number
}

export interface RecentTaskItem {
  id: string
  title: string
  status: TaskStatus
  dueDate: Date | null
  assignee: { id: string; name: string } | null
  project: { id: string; name: string }
}

const TASK_OPEN_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW"]

function getTaskWhereFilter(userId?: string) {
  const where: Record<string, unknown> = { deletedAt: null }
  if (userId) {
    where.assigneeId = userId
  }
  return where
}

export const dashboardService = {
  async getMetrics(userId?: string): Promise<DashboardMetrics> {
    const taskFilter = getTaskWhereFilter(userId)

    const [
      totalProjects,
      totalAssets,
      totalShots,
      openTasks,
      overdueTasks,
      activeAssets,
      activeShots,
    ] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.asset.count({ where: { deletedAt: null } }),
      prisma.shot.count({ where: { deletedAt: null } }),
      prisma.task.count({
        where: {
          ...taskFilter,
          deletedAt: null,
          status: { in: TASK_OPEN_STATUSES },
        },
      }),
      prisma.task.count({
        where: {
          ...taskFilter,
          deletedAt: null,
          status: { not: "COMPLETE" },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.asset.count({
        where: { deletedAt: null, status: { not: "COMPLETE" } },
      }),
      prisma.shot.count({
        where: { deletedAt: null, status: { not: "COMPLETE" } },
      }),
    ])

    return {
      totalProjects,
      totalAssets,
      totalShots,
      openTasks,
      overdueTasks,
      activeAssets,
      activeShots,
    }
  },

  async getRecentTasks(userId?: string, limit = 5): Promise<RecentTaskItem[]> {
    const taskFilter = getTaskWhereFilter(userId)

    const tasks = await prisma.task.findMany({
      where: { ...taskFilter, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    })

    return tasks as RecentTaskItem[]
  },

  async getTaskStatusDistribution(userId?: string): Promise<StatusDistribution[]> {
    const taskFilter = getTaskWhereFilter(userId)

    const tasks = await prisma.task.findMany({
      where: { ...taskFilter, deletedAt: null },
      select: { status: true },
    })

    const counts: Record<string, number> = {}
    for (const task of tasks) {
      counts[task.status] = (counts[task.status] || 0) + 1
    }

    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  },

  async getProjectStatusDistribution(): Promise<StatusDistribution[]> {
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      select: { status: true },
    })

    const counts: Record<string, number> = {}
    for (const project of projects) {
      counts[project.status] = (counts[project.status] || 0) + 1
    }

    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  },
}
