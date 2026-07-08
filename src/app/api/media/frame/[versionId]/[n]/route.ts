import { versionMediaPaths } from "@/lib/config"
import { serveFile } from "@/lib/media-response"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ versionId: string; n: string }> }
) {
  const { versionId, n } = await params
  const frame = Number(n)
  if (!Number.isInteger(frame) || frame < 1) {
    return new Response("Bad frame", { status: 400 })
  }
  const { frameFile } = versionMediaPaths(versionId)
  return serveFile(frameFile(frame), "image/jpeg")
}
