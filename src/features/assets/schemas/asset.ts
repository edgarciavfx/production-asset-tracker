import { z } from "zod"

const assetTypeEnum = z.enum(["CHARACTER", "PROP", "ENVIRONMENT", "VEHICLE", "OTHER"])
const assetStatusEnum = z.enum(["NOT_STARTED", "IN_PROGRESS", "REVIEW", "APPROVED", "COMPLETE"])

export const createAssetSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less"),
  type: assetTypeEnum.default("OTHER"),
  status: assetStatusEnum.default("NOT_STARTED"),
  projectId: z.string().min(1, "Project is required"),
})

export const updateAssetSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less").optional(),
  type: assetTypeEnum.optional(),
  status: assetStatusEnum.optional(),
  projectId: z.string().min(1, "Project is required").optional(),
})

export type CreateAssetInput = z.input<typeof createAssetSchema>
export type CreateAssetOutput = z.output<typeof createAssetSchema>
export type UpdateAssetInput = z.input<typeof updateAssetSchema>
export type UpdateAssetOutput = z.output<typeof updateAssetSchema>
