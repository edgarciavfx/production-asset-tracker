import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { assetService } from "@/features/assets/services/asset-service"
import { AssetsPageContent } from "@/features/assets/components/assets-page-content"
import prisma from "@/lib/prisma"
import type { AssetStatus, AssetType } from "@/generated/prisma/enums"

interface AssetsPageProps {
  searchParams: Promise<{
    page?: string
    sort?: string
    order?: string
    search?: string
    status?: string
    type?: string
    projectId?: string
  }>
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || "1"))
  const sort = params.sort || "name"
  const order = (params.order === "desc" ? "desc" : "asc") as "asc" | "desc"
  const search = params.search || ""
  const status = (params.status || "") as AssetStatus | ""
  const type = (params.type || "") as AssetType | ""
  const projectId = params.projectId || ""

  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const result = await assetService.listAssets({
    page,
    sort,
    order,
    search,
    status,
    type,
    projectId,
  })

  return (
    <AssetsPageContent
      initialData={result}
      sort={sort}
      order={order}
      search={search}
      status={status}
      type={type}
      projectId={projectId}
      projects={projects}
    />
  )
}
