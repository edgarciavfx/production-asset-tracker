import { Badge } from "@/components/ui/badge"
import type { AssetType } from "@/generated/prisma/enums"

const typeConfig: Record<AssetType, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  CHARACTER: { label: "Character", variant: "default" },
  PROP: { label: "Prop", variant: "secondary" },
  ENVIRONMENT: { label: "Environment", variant: "outline" },
  VEHICLE: { label: "Vehicle", variant: "default" },
  OTHER: { label: "Other", variant: "secondary" },
}

export function AssetTypeBadge({ type }: { type: AssetType }) {
  const config = typeConfig[type]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
