import prisma from "@/lib/prisma"

export interface SearchResultItem {
  id: string
  label: string
  sublabel: string
  type: "project" | "asset" | "shot" | "task"
  href: string
}

export interface SearchResults {
  projects: SearchResultItem[]
  assets: SearchResultItem[]
  shots: SearchResultItem[]
  tasks: SearchResultItem[]
}

const SEARCH_LIMIT = 5

export const searchService = {
  async globalSearch(query: string): Promise<SearchResults> {
    if (!query.trim()) {
      return { projects: [], assets: [], shots: [], tasks: [] }
    }

    const [projects, assets, shots, tasks] = await Promise.all([
      prisma.project.findMany({
        where: {
          deletedAt: null,
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true },
        take: SEARCH_LIMIT,
        orderBy: { name: "asc" },
      }),
      prisma.asset.findMany({
        where: {
          deletedAt: null,
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true, project: { select: { name: true } } },
        take: SEARCH_LIMIT,
        orderBy: { name: "asc" },
      }),
      prisma.shot.findMany({
        where: {
          deletedAt: null,
          code: { contains: query, mode: "insensitive" },
        },
        select: { id: true, code: true, project: { select: { name: true } } },
        take: SEARCH_LIMIT,
        orderBy: { code: "asc" },
      }),
      prisma.task.findMany({
        where: {
          deletedAt: null,
          title: { contains: query, mode: "insensitive" },
        },
        select: { id: true, title: true, project: { select: { name: true } } },
        take: SEARCH_LIMIT,
        orderBy: { createdAt: "desc" },
      }),
    ])

    return {
      projects: projects.map((p) => ({
        id: p.id,
        label: p.name,
        sublabel: "Project",
        type: "project" as const,
        href: `/projects?search=${encodeURIComponent(p.name)}`,
      })),
      assets: assets.map((a) => ({
        id: a.id,
        label: a.name,
        sublabel: `Asset · ${a.project.name}`,
        type: "asset" as const,
        href: `/assets?search=${encodeURIComponent(a.name)}`,
      })),
      shots: shots.map((s) => ({
        id: s.id,
        label: s.code,
        sublabel: `Shot · ${s.project.name}`,
        type: "shot" as const,
        href: `/shots?search=${encodeURIComponent(s.code)}`,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        label: t.title,
        sublabel: `Task · ${t.project.name}`,
        type: "task" as const,
        href: `/tasks/${t.id}`,
      })),
    }
  },
}
