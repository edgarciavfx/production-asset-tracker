import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { projectService } from "@/features/projects/services/project-service"
import { ProjectsPageContent } from "@/features/projects/components/projects-page-content"
import type { ProjectStatus } from "@/generated/prisma/enums"

interface ProjectsPageProps {
  searchParams: Promise<{
    page?: string
    sort?: string
    order?: string
    search?: string
    status?: string
  }>
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || "1"))
  const sort = params.sort || "name"
  const order = (params.order === "desc" ? "desc" : "asc") as "asc" | "desc"
  const search = params.search || ""
  const status = (params.status || "") as ProjectStatus | ""

  const result = await projectService.listProjects({
    page,
    sort,
    order,
    search,
    status,
  })

  return (
    <ProjectsPageContent
      initialData={result}
      sort={sort}
      order={order}
      search={search}
      status={status}
    />
  )
}
