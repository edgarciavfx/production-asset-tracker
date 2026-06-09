import { Badge } from "@/components/ui/badge"
import type { AssetStatus } from "@/generated/prisma/enums"

const statusConfig: Record<AssetStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  NOT_STARTED: { label: "Not Started", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  REVIEW: { label: "Review", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  COMPLETE: { label: "Complete", variant: "outline" },
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
