import type { Session } from "next-auth"

export function requireAuth(session: Session | null): asserts session is Session & { user: { id: string; role: string } } {
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
}

export function canCreateProject(session: Session | null): boolean {
  if (!session?.user?.id) return false
  return true
}

export function canUpdateProject(session: Session | null): boolean {
  if (!session?.user?.id) return false
  return true
}

export function canDeleteProject(session: Session | null): boolean {
  if (!session?.user?.id) return false
  return true
}

export function canCreateAsset(session: Session | null): boolean {
  if (!session?.user?.id) return false
  return true
}

export function canUpdateAsset(session: Session | null): boolean {
  if (!session?.user?.id) return false
  return true
}

export function canDeleteAsset(session: Session | null): boolean {
  if (!session?.user?.id) return false
  return true
}
