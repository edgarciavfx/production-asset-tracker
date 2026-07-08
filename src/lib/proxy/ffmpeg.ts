import "server-only"
import { spawn } from "node:child_process"
import { FFMPEG, FFPROBE } from "@/lib/config"

export interface RunResult {
  code: number
  stdout: string
  stderr: string
}

/** Spawn a binary, capture output, resolve with the exit code (never rejects). */
export function run(bin: string, args: string[]): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (d) => (stdout += d.toString()))
    child.stderr.on("data", (d) => (stderr += d.toString()))
    child.on("error", reject)
    child.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }))
  })
}

export function ffmpeg(args: string[]) {
  // -y overwrite, -nostdin so a stalled prompt can't hang the worker.
  return run(FFMPEG, ["-y", "-nostdin", ...args])
}

export function ffprobe(args: string[]) {
  return run(FFPROBE, args)
}

/** Probe a media file for frame count + fps. Returns null on failure. */
export async function probeVideo(
  src: string
): Promise<{ frames: number; fps: number } | null> {
  const res = await ffprobe([
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-count_frames",
    "-show_entries",
    "stream=nb_read_frames,r_frame_rate",
    "-of",
    "json",
    src,
  ])
  if (res.code !== 0) return null
  try {
    const parsed = JSON.parse(res.stdout)
    const stream = parsed.streams?.[0]
    if (!stream) return null
    const frames = Number(stream.nb_read_frames)
    const [num, den] = String(stream.r_frame_rate ?? "24/1").split("/")
    const fps = Number(num) / (Number(den) || 1)
    return {
      frames: Number.isFinite(frames) ? frames : 0,
      fps: Number.isFinite(fps) && fps > 0 ? Math.round(fps) : 24,
    }
  } catch {
    return null
  }
}
