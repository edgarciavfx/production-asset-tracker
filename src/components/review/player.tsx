"use client"

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react"
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Pencil,
  Play,
  Repeat,
  Square,
  Trash2,
  Undo2,
} from "lucide-react"
import { cn } from "@/lib/cn"
import { timecode } from "@/lib/format"
import { parseDrawing, type Drawing, type Stroke } from "@/lib/annotations"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AnnotationSvg, DrawCanvas, type Tool } from "./annotation"

const COLORS = ["#ff3b30", "#ffcc00", "#34c759", "#0a84ff", "#ffffff"]
const TOOLS: { tool: Tool; label: string }[] = [
  { tool: "pen", label: "Pen" },
  { tool: "arrow", label: "Arrow" },
  { tool: "rect", label: "Box" },
  { tool: "ellipse", label: "Ellipse" },
]

export interface PlayerVersion {
  id: string
  frameCount: number
  frameStart: number
  fps: number
}

/** Notes relevant to overlay rendering — just what the player needs. */
export interface PlayerNote {
  frame: number | null
  drawing: string | null
  resolved: boolean
}

export interface PlayerHandle {
  /** Jump the playhead to a (1-based) proxy frame. */
  seek: (frame: number) => void
}

export function Player({
  ref,
  version,
  notes,
  onFrame,
  onCreateNote,
}: {
  ref?: Ref<PlayerHandle>
  version: PlayerVersion
  notes: PlayerNote[]
  onFrame: (f: number) => void
  onCreateNote: (input: {
    frame: number
    body: string | null
    drawing: Drawing | null
  }) => Promise<void>
}) {
  const { id, frameCount, frameStart, fps } = version

  // The player owns its playhead; the parent only observes it via onFrame.
  const [frame, setFrame] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [loop, setLoop] = useState(true)
  const [inPoint, setInPoint] = useState(1)
  const [outPoint, setOutPoint] = useState(frameCount)
  const [loaded, setLoaded] = useState(0)
  const [aspect, setAspect] = useState(16 / 9)

  // Annotation state
  const [drawMode, setDrawMode] = useState(false)
  const [tool, setTool] = useState<Tool>("pen")
  const [color, setColor] = useState(COLORS[0])
  const [pending, setPending] = useState<Stroke[]>([])
  const [noteText, setNoteText] = useState("")
  const [saving, setSaving] = useState(false)

  const boxRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  const clampFrame = useCallback(
    (f: number) => Math.min(frameCount, Math.max(1, f)),
    [frameCount]
  )

  const goTo = useCallback(
    (f: number) => {
      setPlaying(false)
      setFrame(clampFrame(f))
    },
    [clampFrame]
  )

  useImperativeHandle(ref, () => ({ seek: goTo }), [goTo])

  // Report the playhead upward for the notes panel highlight.
  useEffect(() => {
    onFrame(frame)
  }, [frame, onFrame])

  /* -------------------------------------------------------- frame preload */
  // Player is keyed by version id in the parent, so it remounts per version —
  // state starts fresh and needs no reset effects here.
  useEffect(() => {
    let cancelled = false
    const images: HTMLImageElement[] = []
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image()
      img.onload = () => {
        if (cancelled) return
        setLoaded((n) => n + 1)
        if (i === 1) setAspect(img.naturalWidth / img.naturalHeight || 16 / 9)
      }
      img.src = `/api/media/frame/${id}/${i}`
      images.push(img)
    }
    return () => {
      cancelled = true
      images.forEach((img) => (img.onload = null))
    }
  }, [id, frameCount])

  /* -------------------------------------------------------------- measure */
  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setBox({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ------------------------------------------------------------- playback */
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let acc = 0
    const spf = 1000 / fps
    const tick = (now: number) => {
      acc += now - last
      last = now
      if (acc >= spf) {
        const steps = Math.floor(acc / spf)
        acc -= steps * spf
        setFrame((f) => {
          const hi = Math.max(inPoint, outPoint)
          const lo = Math.min(inPoint, outPoint)
          let next = f + steps
          if (next > hi) {
            if (loop) {
              const span = hi - lo + 1
              next = lo + ((next - lo) % span)
            } else {
              next = hi
              queueMicrotask(() => setPlaying(false))
            }
          }
          return next
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, fps, loop, inPoint, outPoint])

  /* ----------------------------------------------------------- keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return
      switch (e.key) {
        case " ":
          e.preventDefault()
          setPlaying((p) => !p)
          break
        case "ArrowRight":
          e.preventDefault()
          goTo(frame + 1)
          break
        case "ArrowLeft":
          e.preventDefault()
          goTo(frame - 1)
          break
        case "Home":
          e.preventDefault()
          goTo(1)
          break
        case "End":
          e.preventDefault()
          goTo(frameCount)
          break
        case "i":
          setInPoint(frame)
          break
        case "o":
          setOutPoint(frame)
          break
        case "l":
          setLoop((v) => !v)
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [frame, frameCount, goTo])

  /* -------------------------------------------------------------- save */
  async function saveNote() {
    if (pending.length === 0 && !noteText.trim()) return
    setSaving(true)
    try {
      await onCreateNote({
        frame,
        body: noteText.trim() || null,
        drawing:
          pending.length > 0
            ? { width: box.w, height: box.h, strokes: pending }
            : null,
      })
      setPending([])
      setNoteText("")
      setDrawMode(false)
    } finally {
      setSaving(false)
    }
  }

  const sourceFrame = frameStart + frame - 1
  const ready = loaded >= frameCount

  // Strokes saved on the current frame (read-only overlay).
  const overlayStrokes = useMemo(() => {
    const out: Stroke[] = []
    for (const n of notes) {
      if (n.frame !== frame || n.resolved) continue
      const d = parseDrawing(n.drawing)
      if (d) out.push(...d.strokes)
    }
    return out
  }, [notes, frame])

  return (
    <div className="flex flex-col gap-3">
      {/* Viewer */}
      <div className="flex items-center justify-center rounded-lg border border-border bg-black/60 p-2">
        <div
          ref={boxRef}
          className="relative"
          style={{ aspectRatio: aspect, maxWidth: "100%", height: "65vh" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-testid="frame-image"
            src={`/api/media/frame/${id}/${frame}`}
            alt={`frame ${frame}`}
            className="absolute inset-0 h-full w-full object-contain select-none"
            draggable={false}
          />
          {box.w > 0 && !drawMode && overlayStrokes.length > 0 && (
            <AnnotationSvg strokes={overlayStrokes} w={box.w} h={box.h} />
          )}
          {box.w > 0 && drawMode && (
            <DrawCanvas
              w={box.w}
              h={box.h}
              tool={tool}
              color={color}
              strokeWidth={3}
              strokes={pending}
              onChange={setPending}
            />
          )}
          {!ready && (
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(loaded / frameCount) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Transport */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="icon" onClick={() => goTo(frame - 1)}>
          <ChevronLeft />
        </Button>
        <Button size="icon" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause /> : <Play />}
        </Button>
        <Button variant="secondary" size="icon" onClick={() => goTo(frame + 1)}>
          <ChevronRight />
        </Button>

        <input
          type="range"
          min={1}
          max={frameCount}
          value={frame}
          onChange={(e) => goTo(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer accent-primary"
        />

        <div className="tabular w-40 text-right font-mono text-sm">
          <span data-testid="source-frame" className="text-foreground">
            {sourceFrame}
          </span>
          <span className="text-muted-foreground">
            {" "}
            / {frameStart + frameCount - 1}
          </span>
          <div className="text-xs text-muted-foreground">
            {timecode(frame - 1, fps)} · {fps}fps
          </div>
        </div>

        <Button
          variant={loop ? "default" : "secondary"}
          size="icon"
          title="Loop (l)"
          onClick={() => setLoop((v) => !v)}
        >
          <Repeat />
        </Button>
        <Button
          variant={drawMode ? "default" : "secondary"}
          size="icon"
          title="Annotate"
          onClick={() => {
            setDrawMode((v) => !v)
            setPending([])
          }}
        >
          <Pencil />
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          In <b className="text-foreground">{inPoint}</b> · Out{" "}
          <b className="text-foreground">{outPoint}</b>
        </span>
        <span className="text-muted-foreground/60">
          Space play · ← → step · I/O set range · L loop
        </span>
      </div>

      {/* Annotation composer */}
      {drawMode && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            {TOOLS.map((t) => (
              <Button
                key={t.tool}
                size="sm"
                variant={tool === t.tool ? "default" : "outline"}
                onClick={() => setTool(t.tool)}
              >
                {t.label}
              </Button>
            ))}
            <div className="mx-1 flex items-center gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-5 w-5 rounded-full border-2",
                    color === c ? "border-foreground" : "border-transparent"
                  )}
                  style={{ background: c }}
                  aria-label={`color ${c}`}
                />
              ))}
            </div>
            <div className="ml-auto flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPending((s) => s.slice(0, -1))}
                disabled={pending.length === 0}
              >
                <Undo2 /> Undo
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPending([])}
                disabled={pending.length === 0}
              >
                <Trash2 /> Clear
              </Button>
            </div>
          </div>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={`Note on frame ${sourceFrame}… (optional if you've drawn)`}
            rows={2}
          />
          <div className="flex items-center gap-2">
            <Square className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Anchored to frame {sourceFrame}
            </span>
            <Button
              className="ml-auto"
              size="sm"
              onClick={saveNote}
              disabled={saving || (pending.length === 0 && !noteText.trim())}
            >
              {saving ? "Saving…" : "Save note"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
