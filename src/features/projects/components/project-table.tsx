"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ProjectStatusBadge } from "./project-status-badge"
import { EditProjectDialog } from "./edit-project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import { canUpdateProject, canDeleteProject } from "@/lib/permissions"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { ProjectListItem } from "@/features/projects/services/project-service"

function SortIcon({ column, sort, order }: { column: string; sort: string; order: string }) {
  if (sort !== column) return <ArrowUpDown className="ml-1 h-3 w-3" />
  return order === "asc"
    ? <ArrowUp className="ml-1 h-3 w-3" />
    : <ArrowDown className="ml-1 h-3 w-3" />
}

interface ProjectTableProps {
  projects: ProjectListItem[]
  total: number
  page: number
  totalPages: number
  sort: string
  order: "asc" | "desc"
}

export function ProjectTable({ projects, total, page, totalPages, sort, order }: ProjectTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const canEdit = canUpdateProject(session)
  const canDelete = canDeleteProject(session)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== "page") params.set("page", "1")
    router.push(`/projects?${params.toString()}`)
  }

  function toggleSort(column: string) {
    if (sort === column) {
      updateParam("order", order === "asc" ? "desc" : "asc")
    } else {
      updateParam("sort", column)
      updateParam("order", "asc")
    }
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-medium">No projects found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating your first project.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
              <span className="inline-flex items-center">
                Name <SortIcon column="name" sort={sort} order={order} />
              </span>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
              <span className="inline-flex items-center">
                Status <SortIcon column="status" sort={sort} order={order} />
              </span>
            </TableHead>
            <TableHead>Assets</TableHead>
            <TableHead>Shots</TableHead>
            <TableHead className="cursor-pointer" onClick={() => toggleSort("createdAt")}>
              <span className="inline-flex items-center">
                Created <SortIcon column="createdAt" sort={sort} order={order} />
              </span>
            </TableHead>
            {(canEdit || canDelete) && <TableHead className="w-24">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>
                <ProjectStatusBadge status={project.status} />
              </TableCell>
              <TableCell>{project._count.assets}</TableCell>
              <TableCell>{project._count.shots}</TableCell>
              <TableCell className="text-muted-foreground">
                {project.createdAt.toLocaleDateString()}
              </TableCell>
              {(canEdit || canDelete) && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canEdit && <EditProjectDialog project={project} />}
                    {canDelete && <DeleteProjectDialog projectId={project.id} projectName={project.name} />}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-2 py-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParam("page", String(page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParam("page", String(page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
