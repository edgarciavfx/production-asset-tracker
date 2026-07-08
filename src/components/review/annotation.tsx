"use client"

import { useRef, useState } from "react"
import type { Point, Stroke } from "@/lib/annotations"

export type Tool = Stroke["tool"]

/* ---------------------------------------------------------------- rendering */

function penPath(points: Point[], w: number, h: number): string {
  if (points.length === 0) return ""
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * w} ${p.y * h}`)
    .join(" ")
}

function StrokeShape({
  stroke,
  w,
  h,
}: {
  stroke: Stroke
  w: number
  h: number
}) {
  const common = {
    stroke: stroke.color,
    strokeWidth: stroke.width,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
  const pts = stroke.points
  if (stroke.tool === "pen") {
    return <path d={penPath(pts, w, h)} {...common} />
  }
  const a = pts[0]
  const b = pts[pts.length - 1]
  const [ax, ay, bx, by] = [a.x * w, a.y * h, b.x * w, b.y * h]

  if (stroke.tool === "rect") {
    return (
      <rect
        x={Math.min(ax, bx)}
        y={Math.min(ay, by)}
        width={Math.abs(bx - ax)}
        height={Math.abs(by - ay)}
        {...common}
      />
    )
  }
  if (stroke.tool === "ellipse") {
    return (
      <ellipse
        cx={(ax + bx) / 2}
        cy={(ay + by) / 2}
        rx={Math.abs(bx - ax) / 2}
        ry={Math.abs(by - ay) / 2}
        {...common}
      />
    )
  }
  // arrow
  const angle = Math.atan2(by - ay, bx - ax)
  const head = Math.max(10, stroke.width * 4)
  const h1 = angle - Math.PI / 6
  const h2 = angle + Math.PI / 6
  return (
    <g {...common}>
      <line x1={ax} y1={ay} x2={bx} y2={by} />
      <line x1={bx} y1={by} x2={bx - head * Math.cos(h1)} y2={by - head * Math.sin(h1)} />
      <line x1={bx} y1={by} x2={bx - head * Math.cos(h2)} y2={by - head * Math.sin(h2)} />
    </g>
  )
}

/** Read-only render of strokes scaled into a w×h pixel box. */
export function AnnotationSvg({
  strokes,
  w,
  h,
  className,
}: {
  strokes: Stroke[]
  w: number
  h: number
  className?: string
}) {
  return (
    <svg
      className={className}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {strokes.map((s, i) => (
        <StrokeShape key={i} stroke={s} w={w} h={h} />
      ))}
    </svg>
  )
}

/* ------------------------------------------------------------- draw surface */

/**
 * Interactive drawing surface. Captures pointer input into normalized strokes
 * (0..1 against the box) and reports the live stroke list upward. The parent
 * owns the committed strokes so it can undo/clear/save.
 */
export function DrawCanvas({
  w,
  h,
  tool,
  color,
  strokeWidth,
  strokes,
  onChange,
}: {
  w: number
  h: number
  tool: Tool
  color: string
  strokeWidth: number
  strokes: Stroke[]
  onChange: (next: Stroke[]) => void
}) {
  const ref = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<Stroke | null>(null)

  function toNorm(e: React.PointerEvent): Point {
    const rect = ref.current!.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    }
  }

  function down(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toNorm(e)
    setDragging({ tool, color, width: strokeWidth, points: [p] })
  }

  function move(e: React.PointerEvent) {
    if (!dragging) return
    const p = toNorm(e)
    setDragging((d) => {
      if (!d) return d
      if (d.tool === "pen") return { ...d, points: [...d.points, p] }
      return { ...d, points: [d.points[0], p] }
    })
  }

  function up() {
    if (dragging && dragging.points.length > 0) {
      onChange([...strokes, dragging])
    }
    setDragging(null)
  }

  const live = dragging ? [...strokes, dragging] : strokes

  return (
    <svg
      ref={ref}
      data-testid="draw-canvas"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerLeave={up}
      style={{
        position: "absolute",
        inset: 0,
        cursor: "crosshair",
        touchAction: "none",
      }}
    >
      {live.map((s, i) => (
        <StrokeShape key={i} stroke={s} w={w} h={h} />
      ))}
    </svg>
  )
}
