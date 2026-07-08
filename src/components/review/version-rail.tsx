"use client"

import { AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/cn"
import { versionLabel, formatDate } from "@/lib/format"
import type { ProxyStatus, ShotStatus } from "@/lib/db/schema"
import { StatusPill } from "@/components/status-pill"

export interface RailVersion {
  id: string
  number: number
  status: ShotStatus
  proxyStatus: ProxyStatus
  renderedAt: number | string | null
  createdAt: number | string
}

export function VersionRail({
  versions,
  selectedId,
  onSelect,
}: {
  versions: RailVersion[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {versions.map((v) => {
        const selected = v.id === selectedId
        const ready = v.proxyStatus === "ready"
        return (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            className={cn(
              "group relative w-40 shrink-0 overflow-hidden rounded-md border text-left transition-colors",
              selected
                ? "border-primary ring-1 ring-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="relative flex aspect-video items-center justify-center bg-black/50">
              {ready ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/media/thumb/${v.id}`}
                  alt={versionLabel(v.number)}
                  className="h-full w-full object-cover"
                />
              ) : v.proxyStatus === "failed" ? (
                <div className="flex flex-col items-center gap-1 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-[10px]">failed</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-[10px]">{v.proxyStatus}…</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-1 px-2 py-1.5">
              <span className="font-mono text-xs font-medium">
                {versionLabel(v.number)}
              </span>
              <StatusPill status={v.status} />
            </div>
            <div className="px-2 pb-1.5 text-[10px] text-muted-foreground">
              {formatDate(v.renderedAt ?? v.createdAt)}
            </div>
          </button>
        )
      })}
    </div>
  )
}
