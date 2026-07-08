import Link from "next/link"
import { FolderOpen } from "lucide-react"
import { listProjects, listShots } from "@/lib/repo"
import { formatDate } from "@/lib/format"
import { CreateProjectDialog } from "@/components/create-project-dialog"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const projects = listProjects()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Your compositing review projects.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          <FolderOpen className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <p>No projects yet.</p>
          <p className="text-sm">
            Create one, or publish a version from Nuke to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const shotCount = listShots(project.id).length
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between">
                  <h2 className="font-medium group-hover:text-primary">
                    {project.name}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {shotCount} {shotCount === 1 ? "shot" : "shots"}
                  </span>
                </div>
                {project.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Created {formatDate(project.createdAt)}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
