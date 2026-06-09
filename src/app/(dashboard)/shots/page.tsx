import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { shotService } from "@/features/shots/services/shot-service"
import { ShotsPageContent } from "@/features/shots/components/shots-page-content"
import prisma from "@/lib/prisma"
import type { ShotStatus } from "@/generated/prisma/enums"

interface ShotsPageProps {
  searchParams: Promise<{
    page?: string
    sort?: string
    order?: string
    search?: string
    status?: string
    projectId?: string
  }>
}

export default async function ShotsPage({ searchParams }: ShotsPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || "1"))
  const sort = params.sort || "code"
  const order = (params.order === "desc" ? "desc" : "asc") as "asc" | "desc"
  const search = params.search || ""
  const status = (params.status || "") as ShotStatus | ""
  const projectId = params.projectId || ""

  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const result = await shotService.listShots({
    page,
    sort,
    order,
    search,
    status,
    projectId,
  })

  return (
    <ShotsPageContent
      initialData={result}
      sort={sort}
      order={order}
      search={search}
      status={status}
      projectId={projectId}
      projects={projects}
    />
  )
}
