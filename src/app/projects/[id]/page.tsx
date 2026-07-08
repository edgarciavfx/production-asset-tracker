import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, Film } from "lucide-react"
import { getProject, listShots, listVersions } from "@/lib/repo"
import { formatDate, versionLabel } from "@/lib/format"
import { StatusPill } from "@/components/status-pill"
import { CreateShotDialog } from "@/components/create-shot-dialog"
import { ManualPublishDialog } from "@/components/manual-publish-dialog"

export const dynamic = "force-dynamic"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = getProject(id)
  if (!project) notFound()

  const shots = listShots(project.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Projects
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{project.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <ManualPublishDialog projectName={project.name} />
          <CreateShotDialog projectId={project.id} />
        </div>
      </div>

      {shots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          <Film className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <p>No shots yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {shots.map((shot) => {
            const versions = listVersions(shot.id)
            const latest = versions[0]
            return (
              <Link
                key={shot.id}
                href={`/shots/${shot.id}`}
                className="flex items-center gap-4 bg-card px-4 py-3 transition-colors hover:bg-accent"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{shot.code}</span>
                    <StatusPill status={shot.status} />
                  </div>
                  {shot.description && (
                    <p className="text-sm text-muted-foreground">
                      {shot.description}
                    </p>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {latest ? (
                    <>
                      <span className="font-mono text-foreground">
                        {versionLabel(latest.number)}
                      </span>{" "}
                      · {versions.length}{" "}
                      {versions.length === 1 ? "version" : "versions"}
                      <div>{formatDate(latest.renderedAt ?? latest.createdAt)}</div>
                    </>
                  ) : (
                    <span>No versions</span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
