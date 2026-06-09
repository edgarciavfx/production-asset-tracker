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
import { ShotTable } from "./shot-table"
import { CreateShotDialog } from "./create-shot-dialog"
import { canCreateShot } from "@/lib/permissions"
import { Search } from "lucide-react"
import type { ListShotsResult } from "@/features/shots/services/shot-service"

interface ProjectOption {
  id: string
  name: string
}

interface ShotsPageContentProps {
  initialData: ListShotsResult
  sort: string
  order: "asc" | "desc"
  search: string
  status: string
  projectId: string
  projects: ProjectOption[]
}

export function ShotsPageContent({ initialData, sort, order, search, status, projectId, projects }: ShotsPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const canCreate = canCreateShot(session)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set("page", "1")
    router.push(`/shots?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Shots</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your production shots.
          </p>
        </div>
        {canCreate && <CreateShotDialog projects={projects} />}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shots..."
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

      <ShotTable
        shots={initialData.shots}
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
