import type { ShotStatus } from "@/lib/db/schema"

/** v001, v012, v137 … */
export function versionLabel(n: number): string {
  return `v${String(n).padStart(3, "0")}`
}

/** Frames -> SMPTE-ish timecode HH:MM:SS:FF given an fps. */
export function timecode(frame: number, fps: number): string {
  const f = Math.max(0, Math.floor(frame))
  const ff = f % fps
  const totalSeconds = Math.floor(f / fps)
  const ss = totalSeconds % 60
  const mm = Math.floor(totalSeconds / 60) % 60
  const hh = Math.floor(totalSeconds / 3600)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(hh)}:${p(mm)}:${p(ss)}:${p(ff)}`
}

export const STATUS_META: Record<
  ShotStatus,
  { label: string; className: string }
> = {
  WIP: {
    label: "WIP",
    className: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  },
  NEEDS_REVIEW: {
    label: "Needs Review",
    className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
}

export function formatDate(
  d: Date | number | string | null | undefined
): string {
  if (d == null) return "—"
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
