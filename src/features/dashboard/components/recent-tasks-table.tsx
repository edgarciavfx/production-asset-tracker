import { format } from "date-fns"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TaskStatusBadge } from "@/features/tasks/components/task-status-badge"
import type { RecentTaskItem } from "@/features/dashboard/services/dashboard-service"

interface RecentTasksTableProps {
  tasks: RecentTaskItem[]
}

export function RecentTasksTable({ tasks }: RecentTasksTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium">Recent Tasks</h3>
        <p className="text-sm text-muted-foreground">No tasks yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="p-6 pb-2">
        <h3 className="text-sm font-medium">Recent Tasks</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Link
                  href={`/tasks/${task.id}`}
                  className="font-medium hover:underline"
                >
                  {task.title}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">
                  {task.project.name}
                </span>
              </TableCell>
              <TableCell>
                {task.assignee ? task.assignee.name : "-"}
              </TableCell>
              <TableCell>
                {task.dueDate
                  ? format(new Date(task.dueDate), "MMM d, yyyy")
                  : "-"}
              </TableCell>
              <TableCell>
                <TaskStatusBadge status={task.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
