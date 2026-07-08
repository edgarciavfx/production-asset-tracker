import { notFound } from "next/navigation"
import { getProject, getShot, listVersions } from "@/lib/repo"
import { ShotReview, type UIVersion } from "@/components/review/shot-review"

export const dynamic = "force-dynamic"

export default async function ShotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ v?: string }>
}) {
  const { id } = await params
  const { v } = await searchParams

  const shot = getShot(id)
  if (!shot) notFound()
  const project = getProject(shot.projectId)
  if (!project) notFound()

  const versions: UIVersion[] = listVersions(shot.id).map((ver) => ({
    id: ver.id,
    shotId: ver.shotId,
    number: ver.number,
    label: ver.label,
    status: ver.status,
    sourceType: ver.sourceType,
    sourcePath: ver.sourcePath,
    frameStart: ver.frameStart,
    frameEnd: ver.frameEnd,
    fps: ver.fps,
    frameCount: ver.frameCount,
    proxyStatus: ver.proxyStatus,
    proxyError: ver.proxyError,
    nukeScriptPath: ver.nukeScriptPath,
    renderedAt: ver.renderedAt ? ver.renderedAt.getTime() : null,
    createdAt: ver.createdAt.getTime(),
  }))

  const initialSelectedId =
    v && versions.some((ver) => ver.id === v) ? v : versions[0]?.id ?? null

  return (
    <ShotReview
      shot={{ id: shot.id, code: shot.code, status: shot.status }}
      project={{ id: project.id, name: project.name }}
      initialVersions={versions}
      initialSelectedId={initialSelectedId}
    />
  )
}
