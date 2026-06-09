import { Badge } from "@/components/ui/badge"
import type { TaskStatus } from "@/generated/prisma/enums"

const statusConfig: Record<TaskStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  TODO: { label: "Todo", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  REVIEW: { label: "Review", variant: "outline" },
  COMPLETE: { label: "Complete", variant: "outline" },
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
