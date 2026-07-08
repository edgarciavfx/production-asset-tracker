import "server-only"
import {
  createVersion,
  getOrCreateProjectByName,
  getOrCreateShot,
} from "@/lib/repo"
import { enqueueProxyJob } from "@/lib/proxy/worker"
import type { PublishInput } from "@/lib/publish-schema"

/**
 * Register a published version and kick off its proxy transcode. Shared by the
 * /api/publish route (Nuke button) and the in-app "manual ingest" form. Project
 * and shot are created on demand so a publish never fails for a missing parent.
 */
export function ingestVersion(input: PublishInput) {
  const project = getOrCreateProjectByName(input.project)
  const shot = getOrCreateShot(project.id, input.shot)

  const version = createVersion({
    shotId: shot.id,
    label: input.label,
    sourceType: input.sourceType,
    sourcePath: input.sourcePath,
    seqPattern: input.sourceType === "seq" ? input.sourcePath : null,
    frameStart: input.frameStart,
    frameEnd: input.frameEnd,
    fps: Math.round(input.fps),
    nukeScriptPath: input.nukeScriptPath,
    renderedAt: input.renderedAt ? new Date(input.renderedAt) : new Date(),
  })

  enqueueProxyJob(version.id)

  return { project, shot, version }
}
