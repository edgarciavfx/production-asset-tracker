import { z } from "zod"

const shotStatusEnum = z.enum(["NOT_STARTED", "IN_PROGRESS", "REVIEW", "APPROVED", "COMPLETE"])

export const createShotSchema = z.object({
  code: z.string().min(1, "Code is required").max(50, "Code must be 50 characters or less"),
  description: z.string().max(2000, "Description must be 2000 characters or less").optional().nullable(),
  status: shotStatusEnum.default("NOT_STARTED"),
  projectId: z.string().min(1, "Project is required"),
})

export const updateShotSchema = z.object({
  code: z.string().min(1, "Code is required").max(50, "Code must be 50 characters or less").optional(),
  description: z.string().max(2000, "Description must be 2000 characters or less").optional().nullable(),
  status: shotStatusEnum.optional(),
  projectId: z.string().min(1, "Project is required").optional(),
})

export type CreateShotInput = z.input<typeof createShotSchema>
export type CreateShotOutput = z.output<typeof createShotSchema>
export type UpdateShotInput = z.input<typeof updateShotSchema>
export type UpdateShotOutput = z.output<typeof updateShotSchema>
