import { cn } from "@/lib/cn"
import { STATUS_META } from "@/lib/format"
import type { ShotStatus } from "@/lib/db/schema"

export function StatusPill({
  status,
  className,
}: {
  status: ShotStatus
  className?: string
}) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        meta.className,
        className
      )}
    >
      {meta.label}
    </span>
  )
}
