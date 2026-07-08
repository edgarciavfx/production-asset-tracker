/**
 * Client-safe enums shared by the schema and the UI. Kept free of any Node
 * imports so client components can pull the runtime arrays without dragging
 * better-sqlite3 / node:crypto into the browser bundle.
 */
export const SHOT_STATUS = [
  "WIP",
  "NEEDS_REVIEW",
  "APPROVED",
  "REJECTED",
] as const
export type ShotStatus = (typeof SHOT_STATUS)[number]

export const PROXY_STATUS = ["pending", "processing", "ready", "failed"] as const
export type ProxyStatus = (typeof PROXY_STATUS)[number]

export const SOURCE_TYPE = ["mov", "seq"] as const
export type SourceType = (typeof SOURCE_TYPE)[number]
