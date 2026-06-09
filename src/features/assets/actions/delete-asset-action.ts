"use server"

import { auth } from "@/lib/auth"
import { assetService } from "@/features/assets/services/asset-service"
import { canDeleteAsset } from "@/lib/permissions"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"

export async function deleteAssetAction(
  _prevState: ActionResponse<void> | null,
  formData: FormData
): Promise<ActionResponse<void>> {
  const session = await auth()
  if (!canDeleteAsset(session)) {
    return { success: false, error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  if (!id) {
    return { success: false, error: "Missing asset ID" }
  }

  try {
    const existing = await assetService.getAssetById(id)
    if (!existing) {
      return { success: false, error: "Asset not found" }
    }

    await assetService.deleteAsset(id)
    auditService.log("DELETE", "Asset", id, session!.user!.id)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Failed to delete asset" }
  }
}
