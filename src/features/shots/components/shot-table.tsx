"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ShotStatusBadge } from "./shot-status-badge"
import { EditShotDialog } from "./edit-shot-dialog"
import { DeleteShotDialog } from "./delete-shot-dialog"
import { canUpdateShot, canDeleteShot } from "@/lib/permissions"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { ShotListItem } from "@/features/shots/services/shot-service"

interface ProjectOption {
  id: string
  name: string
}

function SortIcon({ column, sort, order }: { column: string; sort: string; order: string }) {
  if (sort !== column) return <ArrowUpDown className="ml-1 h-3 w-3" />
  return order === "asc"
    ? <ArrowUp className="ml-1 h-3 w-3" />
    : <ArrowDown className="ml-1 h-3 w-3" />
}

interface ShotTableProps {
  shots: ShotListItem[]
  total: number
  page: number
  totalPages: number
  sort: string
  order: "asc" | "desc"
  projects: ProjectOption[]
}

export function ShotTable({ shots, total, page, totalPages, sort, order, projects }: ShotTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const canEdit = canUpdateShot(session)
  const canDelete = canDeleteShot(session)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== "page") params.set("page", "1")
    router.push(`/shots?${params.toString()}`)
  }

  function toggleSort(column: string) {
    if (sort === column) {
      updateParam("order", order === "asc" ? "desc" : "asc")
    } else {
      updateParam("sort", column)
      updateParam("order", "asc")
    }
  }

  if (shots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-medium">No shots found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating your first shot.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => toggleSort("code")}>
              <span className="inline-flex items-center">
                Code <SortIcon column="code" sort={sort} order={order} />
              </span>
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
              <span className="inline-flex items-center">
                Status <SortIcon column="status" sort={sort} order={order} />
              </span>
            </TableHead>
            <TableHead>Project</TableHead>
            <TableHead className="cursor-pointer" onClick={() => toggleSort("createdAt")}>
              <span className="inline-flex items-center">
                Created <SortIcon column="createdAt" sort={sort} order={order} />
              </span>
            </TableHead>
            {(canEdit || canDelete) && <TableHead className="w-24">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shots.map((shot) => (
            <TableRow key={shot.id}>
              <TableCell className="font-medium">{shot.code}</TableCell>
              <TableCell className="text-muted-foreground">{shot.description ?? "—"}</TableCell>
              <TableCell><ShotStatusBadge status={shot.status} /></TableCell>
              <TableCell>{shot.project.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {shot.createdAt.toLocaleDateString()}
              </TableCell>
              {(canEdit || canDelete) && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canEdit && <EditShotDialog shot={shot} projects={projects} />}
                    {canDelete && <DeleteShotDialog shotId={shot.id} shotCode={shot.code} />}
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
