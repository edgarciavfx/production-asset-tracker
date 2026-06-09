import { Badge } from "@/components/ui/badge"
import type { TaskPriority } from "@/generated/prisma/enums"

const priorityConfig: Record<TaskPriority, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  LOW: { label: "Low", variant: "secondary" },
  MEDIUM: { label: "Medium", variant: "default" },
  HIGH: { label: "High", variant: "destructive" },
  CRITICAL: { label: "Critical", variant: "destructive" },
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = priorityConfig[priority]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
