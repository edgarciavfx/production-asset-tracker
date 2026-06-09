import { z } from "zod"

const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETE"])

const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  description: z.string().max(2000, "Description must be 2000 characters or less").optional().nullable(),
  status: taskStatusEnum.default("TODO"),
  priority: taskPriorityEnum.default("MEDIUM"),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  projectId: z.string().min(1, "Project is required"),
  assetId: z.string().optional().nullable(),
  shotId: z.string().optional().nullable(),
}).refine(
  (data) => {
    const hasAsset = data.assetId != null && data.assetId !== ""
    const hasShot = data.shotId != null && data.shotId !== ""
    return (hasAsset && !hasShot) || (!hasAsset && hasShot)
  },
  { message: "Task must be assigned to exactly one asset or shot" }
)

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less").optional(),
  description: z.string().max(2000, "Description must be 2000 characters or less").optional().nullable(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  projectId: z.string().min(1, "Project is required").optional(),
  assetId: z.string().optional().nullable(),
  shotId: z.string().optional().nullable(),
}).refine(
  (data) => {
    const hasAsset = data.assetId !== undefined && data.assetId !== null && data.assetId !== ""
    const hasShot = data.shotId !== undefined && data.shotId !== null && data.shotId !== ""
    if (!hasAsset && !hasShot) return true
    return (hasAsset && !hasShot) || (!hasAsset && hasShot)
  },
  { message: "Task must be assigned to exactly one asset or shot" }
)

export type CreateTaskInput = z.input<typeof createTaskSchema>
export type CreateTaskOutput = z.output<typeof createTaskSchema>
export type UpdateTaskInput = z.input<typeof updateTaskSchema>
export type UpdateTaskOutput = z.output<typeof updateTaskSchema>
