import "server-only"
import fs from "node:fs"
import fsp from "node:fs/promises"
import { PROXY_JPEG_QUALITY, PROXY_WIDTH, versionMediaPaths } from "@/lib/config"
import { getVersion, updateVersionProxy } from "@/lib/repo"
import type { Version } from "@/lib/db/schema"
import { ffmpeg, probeVideo } from "./ffmpeg"

/**
 * Dead-simple single-worker queue. Flipbook is single-user, so one ffmpeg job
 * at a time keeps CPU predictable and status easy to reason about. Jobs survive
 * as long as the server process does; a version left `pending`/`processing`
 * after a crash can simply be re-enqueued.
 */
const queue: string[] = []
let running = false

export function enqueueProxyJob(versionId: string) {
  if (!queue.includes(versionId)) queue.push(versionId)
  void pump()
}

async function pump() {
  if (running) return
  running = true
  try {
    while (queue.length) {
      const id = queue.shift()!
      await processVersion(id).catch(async (err) => {
        await updateVersionProxy(id, {
          proxyStatus: "failed",
          proxyError: err instanceof Error ? err.message : String(err),
        })
      })
    }
  } finally {
    running = false
  }
}

// Don't upscale past the source; always land on an even width for yuv420p mp4.
const SCALE = `scale='min(${PROXY_WIDTH},iw)':-2`

async function processVersion(id: string) {
  const version = getVersion(id)
  if (!version) return

  await updateVersionProxy(id, {
    proxyStatus: "processing",
    proxyError: null,
  })

  const paths = versionMediaPaths(id)
  // Start clean so re-runs don't leave stale frames behind.
  await fsp.rm(paths.root, { recursive: true, force: true })
  await fsp.mkdir(paths.framesDir, { recursive: true })

  const framePattern = `${paths.framesDir}/%04d.jpg`
  const qv = String(PROXY_JPEG_QUALITY)

  if (version.sourceType === "mov") {
    const res = await ffmpeg([
      "-i",
      version.sourcePath,
      "-vf",
      SCALE,
      "-q:v",
      qv,
      "-start_number",
      "1",
      framePattern,
    ])
    if (res.code !== 0) throw new Error(ffmpegError(res.stderr))
  } else {
    // Image sequence: read from the printf pattern starting at frameStart.
    const res = await ffmpeg([
      "-start_number",
      String(version.frameStart),
      "-i",
      version.seqPattern ?? version.sourcePath,
      "-vf",
      SCALE,
      "-q:v",
      qv,
      "-start_number",
      "1",
      framePattern,
    ])
    if (res.code !== 0) throw new Error(ffmpegError(res.stderr))
  }

  const frameCount = countFrames(paths.framesDir)
  if (frameCount === 0) {
    throw new Error(
      "ffmpeg produced no frames — check the source path / sequence pattern"
    )
  }

  // Poster thumbnail from the middle proxy frame (fast, no re-decode of source).
  const midIdx = Math.max(1, Math.ceil(frameCount / 2))
  await ffmpeg([
    "-i",
    paths.frameFile(midIdx),
    "-vf",
    "scale='min(480,iw)':-2",
    "-q:v",
    "4",
    paths.thumbPath,
  ])

  // Optional smooth-playback mp4. Best-effort: absence just disables the mp4
  // stream, the JPEG player still works.
  let hasMp4 = false
  const mp4 = await ffmpeg([
    "-framerate",
    String(version.fps),
    "-start_number",
    "1",
    "-i",
    framePattern,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    paths.mp4Path,
  ])
  if (mp4.code === 0 && fs.existsSync(paths.mp4Path)) hasMp4 = true

  await updateVersionProxy(id, {
    proxyStatus: "ready",
    proxyError: null,
    frameCount,
    hasMp4,
  })
}

function countFrames(dir: string): number {
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).length
  } catch {
    return 0
  }
}

/** Pull the last meaningful line out of ffmpeg's stderr for a readable error. */
function ffmpegError(stderr: string): string {
  const lines = stderr
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  return lines[lines.length - 1] ?? "ffmpeg failed"
}

/** Re-enqueue any version stuck mid-flight (e.g. after a server restart). */
export { probeVideo }
export type { Version }
