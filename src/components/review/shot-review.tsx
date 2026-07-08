"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronRight, Copy, FileCode2, Loader2, RefreshCw } from "lucide-react"
import { type Drawing } from "@/lib/annotations"
import { versionLabel } from "@/lib/format"
import { SHOT_STATUS, type ProxyStatus, type ShotStatus } from "@/lib/status"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createNoteAction,
  deleteNoteAction,
  reprocessVersionAction,
  setNoteResolvedAction,
  setVersionStatusAction,
} from "@/app/actions"
import { Player, type PlayerHandle } from "./player"
import { NotesPanel, type UINote } from "./notes-panel"
import { VersionRail, type RailVersion } from "./version-rail"

export interface UIVersion extends RailVersion {
  shotId: string
  label: string | null
  sourceType: "mov" | "seq"
  sourcePath: string
  frameStart: number
  frameEnd: number
  fps: number
  frameCount: number
  nukeScriptPath: string | null
  proxyError: string | null
}

export function ShotReview({
  shot,
  project,
  initialVersions,
  initialSelectedId,
}: {
  shot: { id: string; code: string; status: ShotStatus }
  project: { id: string; name: string }
  initialVersions: UIVersion[]
  initialSelectedId: string | null
}) {
  const [versions, setVersions] = useState(initialVersions)
  const [selectedId, setSelectedId] = useState(
    initialSelectedId ?? initialVersions[0]?.id ?? null
  )
  // Current playhead, reported up by the Player (for the notes-panel highlight).
  const [frame, setFrame] = useState(1)
  const [notes, setNotes] = useState<UINote[]>([])
  const [copied, setCopied] = useState(false)
  const playerRef = useRef<PlayerHandle>(null)

  const selected = versions.find((v) => v.id === selectedId) ?? null

  /* --------------------------------------------- keep URL shareable (?v=) */
  const select = useCallback(
    (id: string) => {
      setSelectedId(id)
      window.history.replaceState(null, "", `/shots/${shot.id}?v=${id}`)
    },
    [shot.id]
  )

  /* ------------------------------------------- poll proxy status until ready */
  const pending = versions.filter(
    (v) => v.proxyStatus === "pending" || v.proxyStatus === "processing"
  )
  useEffect(() => {
    if (pending.length === 0) return
    const timer = setInterval(async () => {
      const updates = await Promise.all(
        pending.map(async (v) => {
          const res = await fetch(`/api/versions/${v.id}/status`, {
            cache: "no-store",
          })
          if (!res.ok) return null
          const data = (await res.json()) as {
            proxyStatus: ProxyStatus
            proxyError: string | null
            frameCount: number
          }
          return { id: v.id, ...data }
        })
      )
      setVersions((prev) =>
        prev.map((v) => {
          const u = updates.find((x) => x && x.id === v.id)
          return u ? { ...v, ...u } : v
        })
      )
    }, 1500)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.map((v) => v.id).join(",")])

  /* --------------------------------------------------------- notes loading */
  const loadNotes = useCallback(async (versionId: string) => {
    const res = await fetch(`/api/versions/${versionId}/notes`, {
      cache: "no-store",
    })
    if (!res.ok) return
    const data = (await res.json()) as { notes: UINote[] }
    setNotes(data.notes)
  }, [])

  useEffect(() => {
    // Load notes for the selected version — a plain data fetch that assigns
    // state only after the request resolves (not a synchronous cascade).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedId) void loadNotes(selectedId)
  }, [selectedId, loadNotes])

  /* ---------------------------------------------------------------- actions */
  const createNote = useCallback(
    async (input: {
      frame: number
      body: string | null
      drawing: Drawing | null
    }) => {
      if (!selectedId) return
      const res = await createNoteAction({ versionId: selectedId, ...input })
      if (res.ok) await loadNotes(selectedId)
    },
    [selectedId, loadNotes]
  )

  const resolveNote = useCallback(
    async (id: string, resolved: boolean) => {
      await setNoteResolvedAction(id, resolved)
      if (selectedId) loadNotes(selectedId)
    },
    [selectedId, loadNotes]
  )

  const removeNote = useCallback(
    async (id: string) => {
      await deleteNoteAction(id, selectedId ?? "")
      if (selectedId) loadNotes(selectedId)
    },
    [selectedId, loadNotes]
  )

  function setVersionStatus(status: string) {
    if (!selected) return
    setVersions((prev) =>
      prev.map((v) =>
        v.id === selected.id ? { ...v, status: status as ShotStatus } : v
      )
    )
    void setVersionStatusAction(selected.id, shot.id, status)
  }

  async function reprocess() {
    if (!selected) return
    setVersions((prev) =>
      prev.map((v) =>
        v.id === selected.id
          ? { ...v, proxyStatus: "pending", proxyError: null }
          : v
      )
    )
    await reprocessVersionAction(selected.id, shot.id)
  }

  function copyNukePath() {
    if (!selected?.nukeScriptPath) return
    navigator.clipboard.writeText(selected.nukeScriptPath)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Projects
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/projects/${project.id}`}
          className="hover:text-foreground"
        >
          {project.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-mono text-foreground">{shot.code}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-xl font-semibold">{shot.code}</h1>
        {selected && (
          <>
            <span className="font-mono text-lg text-muted-foreground">
              {versionLabel(selected.number)}
            </span>
            {selected.label && (
              <span className="text-sm text-muted-foreground">
                “{selected.label}”
              </span>
            )}
            <Select value={selected.status} onValueChange={setVersionStatus}>
              <SelectTrigger className="h-8 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHOT_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        {selected?.nukeScriptPath && (
          <Button
            variant="outline"
            size="sm"
            onClick={copyNukePath}
            title={selected.nukeScriptPath}
          >
            <FileCode2 />
            {copied ? "Copied!" : "Copy .nk path"}
            <Copy className="opacity-60" />
          </Button>
        )}
      </div>

      {versions.length > 0 && (
        <VersionRail
          versions={versions}
          selectedId={selectedId ?? ""}
          onSelect={select}
        />
      )}

      {!selected ? (
        <Empty>No versions yet — publish one from Nuke or the project page.</Empty>
      ) : selected.proxyStatus === "ready" && selected.frameCount > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <Player
            key={selected.id}
            ref={playerRef}
            version={{
              id: selected.id,
              frameCount: selected.frameCount,
              frameStart: selected.frameStart,
              fps: selected.fps,
            }}
            notes={notes}
            onFrame={setFrame}
            onCreateNote={createNote}
          />
          <NotesPanel
            notes={notes}
            frameStart={selected.frameStart}
            currentFrame={frame}
            onJump={(f) => playerRef.current?.seek(f)}
            onResolve={resolveNote}
            onDelete={removeNote}
          />
        </div>
      ) : selected.proxyStatus === "failed" ? (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-6">
          <p className="font-medium text-destructive">Proxy transcode failed</p>
          {selected.proxyError && (
            <p className="font-mono text-xs text-muted-foreground">
              {selected.proxyError}
            </p>
          )}
          <Button variant="outline" size="sm" onClick={reprocess}>
            <RefreshCw /> Retry
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Transcoding proxy ({selected.proxyStatus})…
        </div>
      )}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
      {children}
    </div>
  )
}
