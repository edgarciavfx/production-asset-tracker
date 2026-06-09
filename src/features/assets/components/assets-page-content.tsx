"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AssetTable } from "./asset-table"
import { CreateAssetDialog } from "./create-asset-dialog"
import { canCreateAsset } from "@/lib/permissions"
import { Search } from "lucide-react"
import type { ListAssetsResult } from "@/features/assets/services/asset-service"

interface ProjectOption {
  id: string
  name: string
}

interface AssetsPageContentProps {
  initialData: ListAssetsResult
  sort: string
  order: "asc" | "desc"
  search: string
  status: string
  type: string
  projectId: string
  projects: ProjectOption[]
}

export function AssetsPageContent({ initialData, sort, order, search, status, type, projectId, projects }: AssetsPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const canCreate = canCreateAsset(session)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set("page", "1")
    router.push(`/assets?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your production assets.
          </p>
        </div>
        {canCreate && <CreateAssetDialog projects={projects} />}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            className="pl-8"
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParam("search", (e.target as HTMLInputElement).value)
              }
            }}
          />
        </div>
        <Select
          value={type}
          onValueChange={(v) => updateParam("type", v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="CHARACTER">Character</SelectItem>
            <SelectItem value="PROP">Prop</SelectItem>
            <SelectItem value="ENVIRONMENT">Environment</SelectItem>
            <SelectItem value="VEHICLE">Vehicle</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => updateParam("status", v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="REVIEW">Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="COMPLETE">Complete</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={projectId}
          onValueChange={(v) => updateParam("projectId", v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AssetTable
        assets={initialData.assets}
        total={initialData.total}
        page={initialData.page}
        totalPages={initialData.totalPages}
        sort={sort}
        order={order}
        projects={projects}
      />
    </div>
  )
}
