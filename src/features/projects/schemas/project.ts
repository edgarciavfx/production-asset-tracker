import { z } from "zod"

const projectStatusEnum = z.enum(["ACTIVE", "ON_HOLD", "COMPLETE"])

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less"),
  description: z.string().max(2000, "Description must be 2000 characters or less").optional().nullable(),
  status: projectStatusEnum.default("ACTIVE"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less").optional(),
  description: z.string().max(2000, "Description must be 2000 characters or less").optional().nullable(),
  status: projectStatusEnum.optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
})

export type CreateProjectInput = z.input<typeof createProjectSchema>
export type CreateProjectOutput = z.output<typeof createProjectSchema>
export type UpdateProjectInput = z.input<typeof updateProjectSchema>
export type UpdateProjectOutput = z.output<typeof updateProjectSchema>
