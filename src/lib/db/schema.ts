import { sql } from "drizzle-orm"
import {
  integer,
  sqliteTable,
  text,
  index,
} from "drizzle-orm/sqlite-core"
import { randomUUID } from "node:crypto"
import {
  SHOT_STATUS,
  PROXY_STATUS,
  SOURCE_TYPE,
  type ShotStatus,
  type ProxyStatus,
  type SourceType,
} from "@/lib/status"

// Re-export the client-safe enums so existing server imports keep working.
export { SHOT_STATUS, PROXY_STATUS, SOURCE_TYPE }
export type { ShotStatus, ProxyStatus, SourceType }

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID())

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())

export const projects = sqliteTable("project", {
  id: id(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: createdAt(),
})

export const shots = sqliteTable(
  "shot",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    description: text("description"),
    status: text("status").$type<ShotStatus>().notNull().default("WIP"),
    createdAt: createdAt(),
  },
  (t) => [index("shot_project_idx").on(t.projectId)]
)

export const versions = sqliteTable(
  "version",
  {
    id: id(),
    shotId: text("shot_id")
      .notNull()
      .references(() => shots.id, { onDelete: "cascade" }),
    // Auto-incremented per shot: 1, 2, 3 -> rendered as v001, v002…
    number: integer("number").notNull(),
    label: text("label"),
    status: text("status").$type<ShotStatus>().notNull().default("NEEDS_REVIEW"),

    sourceType: text("source_type").$type<SourceType>().notNull(),
    sourcePath: text("source_path").notNull(),
    seqPattern: text("seq_pattern"),
    frameStart: integer("frame_start").notNull().default(1),
    frameEnd: integer("frame_end").notNull().default(1),
    fps: integer("fps").notNull().default(24),

    nukeScriptPath: text("nuke_script_path"),
    renderedAt: integer("rendered_at", { mode: "timestamp_ms" }),

    proxyStatus: text("proxy_status")
      .$type<ProxyStatus>()
      .notNull()
      .default("pending"),
    proxyError: text("proxy_error"),
    // Number of proxy frames actually generated (drives the player timeline).
    frameCount: integer("frame_count").notNull().default(0),
    hasMp4: integer("has_mp4", { mode: "boolean" }).notNull().default(false),

    createdAt: createdAt(),
  },
  (t) => [index("version_shot_idx").on(t.shotId)]
)

export const notes = sqliteTable(
  "note",
  {
    id: id(),
    versionId: text("version_id")
      .notNull()
      .references(() => versions.id, { onDelete: "cascade" }),
    // 1-based proxy frame the note is anchored to; null = general note.
    frame: integer("frame"),
    body: text("body"),
    // Vector strokes as JSON (see lib/annotations types). Null = no drawing.
    drawing: text("drawing"),
    hasDrawing: integer("has_drawing", { mode: "boolean" })
      .notNull()
      .default(false),
    resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("note_version_idx").on(t.versionId)]
)

export type Project = typeof projects.$inferSelect
export type Shot = typeof shots.$inferSelect
export type Version = typeof versions.$inferSelect
export type Note = typeof notes.$inferSelect

// Re-exported for callers that build raw SQL fragments.
export { sql }
