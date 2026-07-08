import { z } from "zod"

/**
 * Vector annotation format. Strokes are stored normalized (0..1) against the
 * frame so they render crisply at any display size and survive proxy-resolution
 * changes. A note owns one drawing (an array of strokes).
 */
export const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
})

export const strokeSchema = z.object({
  tool: z.enum(["pen", "arrow", "rect", "ellipse"]),
  color: z.string(),
  width: z.number().positive(),
  points: z.array(pointSchema).min(1),
})

export const drawingSchema = z.object({
  // Aspect ratio the strokes were authored against, so flattening picks a
  // matching canvas size.
  width: z.number().positive(),
  height: z.number().positive(),
  strokes: z.array(strokeSchema),
})

export type Point = z.infer<typeof pointSchema>
export type Stroke = z.infer<typeof strokeSchema>
export type Drawing = z.infer<typeof drawingSchema>

export function parseDrawing(json: string | null | undefined): Drawing | null {
  if (!json) return null
  const parsed = drawingSchema.safeParse(JSON.parse(json))
  return parsed.success ? parsed.data : null
}
