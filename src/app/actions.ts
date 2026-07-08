"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { action, type ActionResponse } from "@/lib/action-response"
import { drawingSchema } from "@/lib/annotations"
import { publishSchema } from "@/lib/publish-schema"
import { ingestVersion } from "@/lib/ingest"
import { enqueueProxyJob } from "@/lib/proxy/worker"
import { SHOT_STATUS } from "@/lib/db/schema"
import * as repo from "@/lib/repo"

/* ------------------------------------------------------------------ projects */

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
})

export async function createProjectAction(
  input: z.input<typeof createProjectSchema>
): Promise<ActionResponse<{ id: string }>> {
  return action(() => {
    const { name, description } = createProjectSchema.parse(input)
    const project = repo.createProject({ name, description })
    revalidatePath("/")
    return { id: project.id }
  })
}

/* --------------------------------------------------------------------- shots */

const createShotSchema = z.object({
  projectId: z.string().min(1),
  code: z.string().trim().min(1, "Shot code is required"),
  description: z.string().trim().optional(),
})

export async function createShotAction(
  input: z.input<typeof createShotSchema>
): Promise<ActionResponse<{ id: string }>> {
  return action(() => {
    const { projectId, code, description } = createShotSchema.parse(input)
    const shot = repo.createShot({ projectId, code, description })
    revalidatePath(`/projects/${projectId}`)
    return { id: shot.id }
  })
}

const statusSchema = z.enum(SHOT_STATUS)

export async function setShotStatusAction(
  id: string,
  status: string
): Promise<ActionResponse> {
  return action(() => {
    repo.setShotStatus(id, statusSchema.parse(status))
    revalidatePath(`/shots/${id}`)
  })
}

/* ------------------------------------------------------------------ versions */

export async function setVersionStatusAction(
  versionId: string,
  shotId: string,
  status: string
): Promise<ActionResponse> {
  return action(() => {
    repo.setVersionStatus(versionId, statusSchema.parse(status))
    revalidatePath(`/shots/${shotId}`)
  })
}

/** Manual ingest form: same payload as the Nuke button. */
export async function manualPublishAction(
  input: unknown
): Promise<ActionResponse<{ versionId: string; shotId: string }>> {
  return action(() => {
    const parsed = publishSchema.parse(input)
    const { version, shot } = ingestVersion(parsed)
    revalidatePath(`/projects/${shot.projectId}`)
    revalidatePath(`/shots/${shot.id}`)
    return { versionId: version.id, shotId: shot.id }
  })
}

/** Re-run the proxy transcode for a version (e.g. after a failure). */
export async function reprocessVersionAction(
  versionId: string,
  shotId: string
): Promise<ActionResponse> {
  return action(() => {
    repo.updateVersionProxy(versionId, {
      proxyStatus: "pending",
      proxyError: null,
    })
    enqueueProxyJob(versionId)
    revalidatePath(`/shots/${shotId}`)
  })
}

/* --------------------------------------------------------------------- notes */

const createNoteSchema = z
  .object({
    versionId: z.string().min(1),
    frame: z.number().int().positive().nullable(),
    body: z.string().trim().nullish(),
    drawing: drawingSchema.nullable().optional(),
  })
  .refine((v) => (v.body && v.body.length > 0) || v.drawing, {
    message: "A note needs text or a drawing",
  })

export async function createNoteAction(
  input: z.input<typeof createNoteSchema>
): Promise<ActionResponse<{ id: string }>> {
  return action(() => {
    const parsed = createNoteSchema.parse(input)
    const note = repo.createNote({
      versionId: parsed.versionId,
      frame: parsed.frame,
      body: parsed.body || null,
      drawing: parsed.drawing ? JSON.stringify(parsed.drawing) : null,
    })
    revalidatePath(`/versions/${parsed.versionId}/notes`)
    return { id: note.id }
  })
}

export async function setNoteResolvedAction(
  id: string,
  resolved: boolean
): Promise<ActionResponse> {
  return action(() => {
    const note = repo.setNoteResolved(id, resolved)
    revalidatePath(`/versions/${note.versionId}/notes`)
  })
}

export async function deleteNoteAction(
  id: string,
  versionId: string
): Promise<ActionResponse> {
  return action(() => {
    repo.deleteNote(id)
    revalidatePath(`/versions/${versionId}/notes`)
  })
}
