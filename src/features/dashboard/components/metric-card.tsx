import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: number
  icon: LucideIcon
  description?: string
}

export function MetricCard({ title, value, icon: Icon, description }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
