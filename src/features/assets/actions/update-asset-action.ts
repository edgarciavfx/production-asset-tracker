"use server"

import { auth } from "@/lib/auth"
import { updateAssetSchema } from "@/features/assets/schemas/asset"
import { assetService } from "@/features/assets/services/asset-service"
import { canUpdateAsset } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"
import type { Asset } from "@/generated/prisma/client"

export async function updateAssetAction(
  _prevState: ActionResponse<Asset> | null,
  formData: FormData
): Promise<ActionResponse<Asset>> {
  const session = await auth()
  if (!canUpdateAsset(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  if (!id) {
    return { success: false, error: "Missing asset ID" }
  }

  const validated = updateAssetSchema.safeParse({
    name: formData.get("name") || undefined,
    type: formData.get("type") || undefined,
    status: formData.get("status") || undefined,
    projectId: formData.get("projectId") || undefined,
  })

  if (!validated.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const existing = await assetService.getAssetById(id)
    if (!existing) {
      return { success: false, error: "Asset not found" }
    }

    const asset = await assetService.updateAsset(id, validated.data)
    auditService.log("UPDATE", "Asset", id, session!.user!.id)
    return { success: true, data: asset as Asset }
  } catch {
    return { success: false, error: "Failed to update asset" }
  }
}
