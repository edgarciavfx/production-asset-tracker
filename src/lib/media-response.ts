import "server-only"
import fs from "node:fs"
import fsp from "node:fs/promises"
import { Readable } from "node:stream"

/** Serve a whole small file (jpg frames, thumbnails) as an immutable response. */
export async function serveFile(
  filePath: string,
  contentType: string
): Promise<Response> {
  try {
    const buf = await fsp.readFile(filePath)
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buf.byteLength),
        // Frames are content-addressed by version id and never mutate once
        // written, so they're safe to cache hard for the session.
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}

/**
 * Serve a file with HTTP range support (mp4 scrubbing). Honors a single-range
 * `Range: bytes=start-end` header, replying 206 with the requested slice.
 */
export async function serveRange(
  filePath: string,
  contentType: string,
  rangeHeader: string | null
): Promise<Response> {
  let size: number
  try {
    size = (await fsp.stat(filePath)).size
  } catch {
    return new Response("Not found", { status: 404 })
  }

  const commonHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=31536000, immutable",
  }

  const match = rangeHeader?.match(/bytes=(\d*)-(\d*)/)
  if (!match) {
    const stream = Readable.toWeb(
      fs.createReadStream(filePath)
    ) as ReadableStream<Uint8Array>
    return new Response(stream, {
      headers: { ...commonHeaders, "Content-Length": String(size) },
    })
  }

  const start = match[1] ? Number(match[1]) : 0
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1
  if (start > end || start >= size) {
    return new Response("Range Not Satisfiable", {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` },
    })
  }

  const stream = Readable.toWeb(
    fs.createReadStream(filePath, { start, end })
  ) as ReadableStream<Uint8Array>
  return new Response(stream, {
    status: 206,
    headers: {
      ...commonHeaders,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
    },
  })
}
