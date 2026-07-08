import path from "node:path"

/**
 * Central runtime configuration for Flipbook. Everything is derived from a
 * single data directory so the whole tool is portable — copy the data dir and
 * you've copied the DB plus every generated proxy.
 */

const repoRoot = process.cwd()

/** Root directory for the SQLite DB and all generated media. */
export const DATA_DIR = path.resolve(
  repoRoot,
  process.env.FLIPBOOK_DATA_DIR ?? "./data"
)

/** SQLite database file. */
export const DB_PATH = path.join(DATA_DIR, "flipbook.db")

/** Root under which per-version proxy media is written. */
export const MEDIA_DIR = path.join(DATA_DIR, "media")

/** Server port — the Nuke publish button POSTs here. */
export const PORT = Number(process.env.PORT ?? 3000)

/** External binaries. Overridable for non-standard installs. */
export const FFMPEG = process.env.FLIPBOOK_FFMPEG ?? "ffmpeg"
export const FFPROBE = process.env.FLIPBOOK_FFPROBE ?? "ffprobe"

/** Long-edge width (px) of generated proxy frames. */
export const PROXY_WIDTH = Number(process.env.FLIPBOOK_PROXY_WIDTH ?? 1280)

/** JPEG quality passed to ffmpeg (-q:v, lower is better; 2 is visually clean). */
export const PROXY_JPEG_QUALITY = 3

/** Per-version media paths, all relative to MEDIA_DIR/<versionId>/. */
export function versionMediaPaths(versionId: string) {
  const root = path.join(MEDIA_DIR, versionId)
  return {
    root,
    framesDir: path.join(root, "frames"),
    thumbPath: path.join(root, "thumb.jpg"),
    mp4Path: path.join(root, "proxy.mp4"),
    notesDir: path.join(root, "notes"),
    /** Zero-padded frame filename for the 1-based Nth proxy frame. */
    frameFile: (n: number) =>
      path.join(root, "frames", `${String(n).padStart(4, "0")}.jpg`),
  }
}
