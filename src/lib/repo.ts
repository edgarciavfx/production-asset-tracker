import "server-only"
import { and, asc, desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  notes,
  projects,
  shots,
  versions,
  type ProxyStatus,
  type ShotStatus,
  type SourceType,
} from "@/lib/db/schema"

/* ------------------------------------------------------------------ projects */

export function listProjects() {
  return db.select().from(projects).orderBy(desc(projects.createdAt)).all()
}

export function getProject(id: string) {
  return db.select().from(projects).where(eq(projects.id, id)).get()
}

export function createProject(input: { name: string; description?: string }) {
  return db
    .insert(projects)
    .values({ name: input.name, description: input.description ?? null })
    .returning()
    .get()
}

/** Find a project by exact name (used by publish ingest), else create it. */
export function getOrCreateProjectByName(name: string) {
  const existing = db
    .select()
    .from(projects)
    .where(eq(projects.name, name))
    .get()
  return existing ?? createProject({ name })
}

/* --------------------------------------------------------------------- shots */

export function listShots(projectId: string) {
  return db
    .select()
    .from(shots)
    .where(eq(shots.projectId, projectId))
    .orderBy(asc(shots.code))
    .all()
}

export function getShot(id: string) {
  return db.select().from(shots).where(eq(shots.id, id)).get()
}

export function createShot(input: {
  projectId: string
  code: string
  description?: string
}) {
  return db
    .insert(shots)
    .values({
      projectId: input.projectId,
      code: input.code,
      description: input.description ?? null,
    })
    .returning()
    .get()
}

export function getOrCreateShot(projectId: string, code: string) {
  const existing = db
    .select()
    .from(shots)
    .where(and(eq(shots.projectId, projectId), eq(shots.code, code)))
    .get()
  return existing ?? createShot({ projectId, code })
}

export function setShotStatus(id: string, status: ShotStatus) {
  return db
    .update(shots)
    .set({ status })
    .where(eq(shots.id, id))
    .returning()
    .get()
}

/* ------------------------------------------------------------------ versions */

export function listVersions(shotId: string) {
  return db
    .select()
    .from(versions)
    .where(eq(versions.shotId, shotId))
    .orderBy(desc(versions.number))
    .all()
}

export function getVersion(id: string) {
  return db.select().from(versions).where(eq(versions.id, id)).get()
}

function nextVersionNumber(shotId: string): number {
  const row = db
    .select({ max: sql<number | null>`max(${versions.number})` })
    .from(versions)
    .where(eq(versions.shotId, shotId))
    .get()
  return (row?.max ?? 0) + 1
}

export function createVersion(input: {
  shotId: string
  label?: string | null
  sourceType: SourceType
  sourcePath: string
  seqPattern?: string | null
  frameStart: number
  frameEnd: number
  fps: number
  nukeScriptPath?: string | null
  renderedAt?: Date | null
}) {
  return db
    .insert(versions)
    .values({
      shotId: input.shotId,
      number: nextVersionNumber(input.shotId),
      label: input.label ?? null,
      sourceType: input.sourceType,
      sourcePath: input.sourcePath,
      seqPattern: input.seqPattern ?? null,
      frameStart: input.frameStart,
      frameEnd: input.frameEnd,
      fps: input.fps,
      nukeScriptPath: input.nukeScriptPath ?? null,
      renderedAt: input.renderedAt ?? null,
      proxyStatus: "pending",
    })
    .returning()
    .get()
}

export function updateVersionProxy(
  id: string,
  patch: {
    proxyStatus?: ProxyStatus
    proxyError?: string | null
    frameCount?: number
    hasMp4?: boolean
  }
) {
  return db
    .update(versions)
    .set(patch)
    .where(eq(versions.id, id))
    .returning()
    .get()
}

export function setVersionStatus(id: string, status: ShotStatus) {
  return db
    .update(versions)
    .set({ status })
    .where(eq(versions.id, id))
    .returning()
    .get()
}

/* --------------------------------------------------------------------- notes */

export function listNotes(versionId: string) {
  return db
    .select()
    .from(notes)
    .where(eq(notes.versionId, versionId))
    .orderBy(asc(notes.frame), asc(notes.createdAt))
    .all()
}

export function getNote(id: string) {
  return db.select().from(notes).where(eq(notes.id, id)).get()
}

export function createNote(input: {
  versionId: string
  frame: number | null
  body?: string | null
  drawing?: string | null
}) {
  return db
    .insert(notes)
    .values({
      versionId: input.versionId,
      frame: input.frame,
      body: input.body ?? null,
      drawing: input.drawing ?? null,
      hasDrawing: !!input.drawing,
    })
    .returning()
    .get()
}

export function setNoteResolved(id: string, resolved: boolean) {
  return db
    .update(notes)
    .set({ resolved })
    .where(eq(notes.id, id))
    .returning()
    .get()
}

export function deleteNote(id: string) {
  return db.delete(notes).where(eq(notes.id, id)).run()
}
