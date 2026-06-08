import { Badge } from "@/components/ui/badge"
import type { ProjectStatus } from "@/generated/prisma/enums"

const statusConfig: Record<ProjectStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  ACTIVE: { label: "Active", variant: "default" },
  ON_HOLD: { label: "On Hold", variant: "secondary" },
  COMPLETE: { label: "Complete", variant: "outline" },
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
