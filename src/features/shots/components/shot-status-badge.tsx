import { Badge } from "@/components/ui/badge"
import type { ShotStatus } from "@/generated/prisma/enums"

const statusConfig: Record<ShotStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  NOT_STARTED: { label: "Not Started", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  REVIEW: { label: "Review", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  COMPLETE: { label: "Complete", variant: "outline" },
}

export function ShotStatusBadge({ status }: { status: ShotStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
