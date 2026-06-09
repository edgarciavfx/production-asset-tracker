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
import { ProjectTable } from "./project-table"
import { CreateProjectDialog } from "./create-project-dialog"
import { canCreateProject } from "@/lib/permissions"
import { Search } from "lucide-react"
import type { ListProjectsResult } from "@/features/projects/services/project-service"

interface ProjectsPageContentProps {
  initialData: ListProjectsResult
  sort: string
  order: "asc" | "desc"
  search: string
  status: string
}

export function ProjectsPageContent({ initialData, sort, order, search, status }: ProjectsPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const canCreate = canCreateProject(session)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set("page", "1")
    router.push(`/projects?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your production projects.
          </p>
        </div>
        {canCreate && <CreateProjectDialog />}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
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
          value={status}
          onValueChange={(v) => updateParam("status", v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETE">Complete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ProjectTable
        projects={initialData.projects}
        total={initialData.total}
        page={initialData.page}
        totalPages={initialData.totalPages}
        sort={sort}
        order={order}
      />
    </div>
  )
}
