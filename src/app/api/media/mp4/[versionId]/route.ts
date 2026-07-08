import { versionMediaPaths } from "@/lib/config"
import { serveRange } from "@/lib/media-response"

export const runtime = "nodejs"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const { versionId } = await params
  const { mp4Path } = versionMediaPaths(versionId)
  return serveRange(mp4Path, "video/mp4", req.headers.get("range"))
}
