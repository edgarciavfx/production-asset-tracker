import { versionMediaPaths } from "@/lib/config"
import { serveFile } from "@/lib/media-response"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const { versionId } = await params
  const { thumbPath } = versionMediaPaths(versionId)
  return serveFile(thumbPath, "image/jpeg")
}
