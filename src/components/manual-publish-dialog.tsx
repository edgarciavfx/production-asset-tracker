"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { manualPublishAction } from "@/app/actions"

/**
 * Register a version by hand — the same payload the Nuke button sends. Handy for
 * testing the pipeline without Nuke, or ingesting a stray render.
 */
export function ManualPublishDialog({
  projectName,
}: {
  projectName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [shot, setShot] = useState("")
  const [label, setLabel] = useState("")
  const [sourceType, setSourceType] = useState<"mov" | "seq">("mov")
  const [sourcePath, setSourcePath] = useState("")
  const [frameStart, setFrameStart] = useState("1")
  const [frameEnd, setFrameEnd] = useState("1")
  const [fps, setFps] = useState("24")
  const [nukeScriptPath, setNukeScriptPath] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit() {
    setError(null)
    start(async () => {
      const res = await manualPublishAction({
        project: projectName,
        shot,
        label: label || undefined,
        sourceType,
        sourcePath,
        frameStart: Number(frameStart),
        frameEnd: Number(frameEnd),
        fps: Number(fps),
        nukeScriptPath: nukeScriptPath || undefined,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.push(`/shots/${res.data.shotId}?v=${res.data.versionId}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload /> Publish Version
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Publish a Version</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mp-shot">Shot code</Label>
              <Input
                id="mp-shot"
                value={shot}
                onChange={(e) => setShot(e.target.value)}
                placeholder="SEQ010_0020"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mp-label">Label</Label>
              <Input
                id="mp-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Optional (e.g. grade v2)"
              />
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label>Source type</Label>
              <Select
                value={sourceType}
                onValueChange={(v) => setSourceType(v as "mov" | "seq")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mov">QuickTime (.mov)</SelectItem>
                  <SelectItem value="seq">Image sequence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mp-path">
                {sourceType === "mov" ? "Movie path" : "Sequence pattern"}
              </Label>
              <Input
                id="mp-path"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                placeholder={
                  sourceType === "mov"
                    ? "/renders/SEQ010_0020_comp_v003.mov"
                    : "/renders/SEQ010_0020/comp.%04d.exr"
                }
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mp-fs">Frame start</Label>
              <Input
                id="mp-fs"
                type="number"
                value={frameStart}
                onChange={(e) => setFrameStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mp-fe">Frame end</Label>
              <Input
                id="mp-fe"
                type="number"
                value={frameEnd}
                onChange={(e) => setFrameEnd(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mp-fps">FPS</Label>
              <Input
                id="mp-fps"
                type="number"
                value={fps}
                onChange={(e) => setFps(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mp-nk">Nuke script path</Label>
            <Input
              id="mp-nk"
              value={nukeScriptPath}
              onChange={(e) => setNukeScriptPath(e.target.value)}
              placeholder="Optional — /scripts/SEQ010_0020_comp_v003.nk"
              className="font-mono text-xs"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={pending || !shot.trim() || !sourcePath.trim()}
          >
            {pending ? "Publishing…" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
