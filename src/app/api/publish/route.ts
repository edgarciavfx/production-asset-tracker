import { NextResponse } from "next/server"
import { publishSchema } from "@/lib/publish-schema"
import { ingestVersion } from "@/lib/ingest"
import { PORT } from "@/lib/config"
import { versionLabel } from "@/lib/format"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = publishSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { project, shot, version } = ingestVersion(parsed.data)
  const reviewPath = `/shots/${shot.id}?v=${version.id}`

  return NextResponse.json(
    {
      versionId: version.id,
      version: versionLabel(version.number),
      shotId: shot.id,
      projectId: project.id,
      proxyStatus: version.proxyStatus,
      reviewUrl: `http://127.0.0.1:${PORT}${reviewPath}`,
      reviewPath,
    },
    { status: 201 }
  )
}
