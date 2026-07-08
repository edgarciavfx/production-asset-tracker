import { z } from "zod"
import { SOURCE_TYPE } from "@/lib/db/schema"

/**
 * Payload accepted by POST /api/publish — the Nuke button and manual ingest.
 * Everything the app needs to register a version and kick off its proxy job.
 */
export const publishSchema = z
  .object({
    project: z.string().min(1, "project is required"),
    shot: z.string().min(1, "shot code is required"),
    label: z.string().optional(),

    sourceType: z.enum(SOURCE_TYPE),
    // Absolute path to the .mov, OR (for seq) the printf-style pattern e.g.
    // /renders/shot_010/comp.%04d.exr — resolved on the server's filesystem.
    sourcePath: z.string().min(1, "sourcePath is required"),
    frameStart: z.number().int().default(1),
    frameEnd: z.number().int().default(1),
    fps: z.number().positive().default(24),

    nukeScriptPath: z.string().optional(),
    renderedAt: z.string().datetime().optional(),
  })
  .refine((v) => v.frameEnd >= v.frameStart, {
    message: "frameEnd must be >= frameStart",
    path: ["frameEnd"],
  })

export type PublishInput = z.infer<typeof publishSchema>
