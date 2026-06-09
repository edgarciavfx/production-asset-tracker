"use server"

import { auth } from "@/lib/auth"
import { createAssetSchema } from "@/features/assets/schemas/asset"
import { assetService } from "@/features/assets/services/asset-service"
import { canCreateAsset } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"
import type { Asset } from "@/generated/prisma/client"

export async function createAssetAction(
  _prevState: ActionResponse<Asset> | null,
  formData: FormData
): Promise<ActionResponse<Asset>> {
  const session = await auth()
  if (!canCreateAsset(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const validated = createAssetSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type") || "OTHER",
    status: formData.get("status") || "NOT_STARTED",
    projectId: formData.get("projectId"),
  })

  if (!validated.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const asset = await assetService.createAsset(validated.data)
    auditService.log("CREATE", "Asset", asset.id, session!.user!.id)
    return { success: true, data: asset as Asset }
  } catch {
    return { success: false, error: "Failed to create asset" }
  }
}
