import { NextResponse } from "next/server"
import { getVersion } from "@/lib/repo"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const version = getVersion(id)
  if (!version) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(
    {
      proxyStatus: version.proxyStatus,
      proxyError: version.proxyError,
      frameCount: version.frameCount,
      hasMp4: version.hasMp4,
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
