"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TaskStatusBadge } from "./task-status-badge"
import { TaskPriorityBadge } from "./task-priority-badge"
import { EditTaskDialog } from "./edit-task-dialog"
import { DeleteTaskDialog } from "./delete-task-dialog"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { TaskListItem } from "@/features/tasks/services/task-service"
import type { ProjectOption } from "./tasks-page-content"
import type { UserOption } from "./tasks-page-content"

function SortIcon({ column, sort, order }: { column: string; sort: string; order: string }) {
  if (sort !== column) return <ArrowUpDown className="ml-1 h-3 w-3" />
  return order === "asc"
    ? <ArrowUp className="ml-1 h-3 w-3" />
    : <ArrowDown className="ml-1 h-3 w-3" />
}

interface TaskTableProps {
  tasks: TaskListItem[]
  total: number
  page: number
  totalPages: number
  sort: string
  order: "asc" | "desc"
  projects: ProjectOption[]
  users: UserOption[]
}

export function TaskTable({ tasks, total, page, totalPages, sort, order, projects, users }: TaskTableProps) {
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
    router.push(`/tasks?${params.toString()}`)
  }

  function toggleSort(column: string) {
    if (sort === column) {
      updateParam("order", order === "asc" ? "desc" : "asc")
    } else {
      updateParam("sort", column)
      updateParam("order", "asc")
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-medium">No tasks found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating your first task.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
              <span className="inline-flex items-center">
                Title <SortIcon column="title" sort={sort} order={order} />
              </span>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
              <span className="inline-flex items-center">
                Status <SortIcon column="status" sort={sort} order={order} />
              </span>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => toggleSort("priority")}>
              <span className="inline-flex items-center">
                Priority <SortIcon column="priority" sort={sort} order={order} />
              </span>
            </TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead>Project</TableHead>
            <TableHead className="cursor-pointer" onClick={() => toggleSort("dueDate")}>
              <span className="inline-flex items-center">
                Due Date <SortIcon column="dueDate" sort={sort} order={order} />
              </span>
            </TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">
                <a href={`/tasks/${task.id}`} className="hover:underline">
                  {task.title}
                </a>
              </TableCell>
              <TableCell><TaskStatusBadge status={task.status} /></TableCell>
              <TableCell><TaskPriorityBadge priority={task.priority} /></TableCell>
              <TableCell>{task.assignee?.name ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {task.asset ? `Asset: ${task.asset.name}` : task.shot ? `Shot: ${task.shot.code}` : "—"}
              </TableCell>
              <TableCell>{task.project.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <EditTaskDialog task={task} projects={projects} users={users} />
                  <DeleteTaskDialog taskId={task.id} taskTitle={task.title} />
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
