"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { AssetStatusBadge } from "./asset-status-badge"
import { AssetTypeBadge } from "./asset-type-badge"
import { EditAssetDialog } from "./edit-asset-dialog"
import { DeleteAssetDialog } from "./delete-asset-dialog"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { AssetListItem } from "@/features/assets/services/asset-service"

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

interface AssetTableProps {
  assets: AssetListItem[]
  total: number
  page: number
  totalPages: number
  sort: string
  order: "asc" | "desc"
  projects: ProjectOption[]
}

export function AssetTable({ assets, total, page, totalPages, sort, order, projects }: AssetTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== "page") params.set("page", "1")
    router.push(`/assets?${params.toString()}`)
  }

  function toggleSort(column: string) {
    if (sort === column) {
      updateParam("order", order === "asc" ? "desc" : "asc")
    } else {
      updateParam("sort", column)
      updateParam("order", "asc")
    }
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-medium">No assets found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating your first asset.
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
            <TableHead className="cursor-pointer" onClick={() => toggleSort("type")}>
              <span className="inline-flex items-center">
                Type <SortIcon column="type" sort={sort} order={order} />
              </span>
            </TableHead>
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
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell><AssetTypeBadge type={asset.type} /></TableCell>
              <TableCell><AssetStatusBadge status={asset.status} /></TableCell>
              <TableCell>{asset.project.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {asset.createdAt.toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <EditAssetDialog asset={asset} projects={projects} />
                  <DeleteAssetDialog assetId={asset.id} assetName={asset.name} />
                </div>
              </TableCell>
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
