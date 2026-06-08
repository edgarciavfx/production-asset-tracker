import prisma from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

export const auditService = {
  async log(
    action: string,
    entityType: string,
    entityId?: string,
    userId?: string,
    metadata?: Prisma.InputJsonValue
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: { action, entityType, entityId, userId, metadata },
      })
    } catch {
      // fire-and-forget: never throw from audit
    }
  },
}
