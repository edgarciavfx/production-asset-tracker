"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TaskTable } from "./task-table"
import { CreateTaskDialog } from "./create-task-dialog"
import { Search } from "lucide-react"
import type { ListTasksResult } from "@/features/tasks/services/task-service"

export interface ProjectOption {
  id: string
  name: string
}

export interface UserOption {
  id: string
  name: string
}

interface TasksPageContentProps {
  initialData: ListTasksResult
  sort: string
  order: "asc" | "desc"
  search: string
  status: string
  priority: string
  projectId: string
  assigneeId: string
  projects: ProjectOption[]
  users: UserOption[]
}

export function TasksPageContent({ initialData, sort, order, search, status, priority, projectId, assigneeId, projects, users }: TasksPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set("page", "1")
    router.push(`/tasks?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage production work assignments.
          </p>
        </div>
        <CreateTaskDialog projects={projects} users={users} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
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
            <SelectItem value="TODO">Todo</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="REVIEW">Review</SelectItem>
            <SelectItem value="COMPLETE">Complete</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priority}
          onValueChange={(v) => updateParam("priority", v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
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
        <Select
          value={assigneeId}
          onValueChange={(v) => updateParam("assigneeId", v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Assignees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Assignees</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TaskTable
        tasks={initialData.tasks}
        total={initialData.total}
        page={initialData.page}
        totalPages={initialData.totalPages}
        sort={sort}
        order={order}
        projects={projects}
        users={users}
      />
    </div>
  )
}
