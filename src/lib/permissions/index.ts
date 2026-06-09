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

export function canCreateShot(session: Session | null): boolean {
  if (!session?.user?.id) return false
  return true
}

export function canUpdateShot(session: Session | null): boolean {
  if (!session?.user?.id) return false
  return true
}

export function canDeleteShot(session: Session | null): boolean {
  if (!session?.user?.id) return false
  return true
}

export function canCreateTask(session: Session | null): boolean {
  if (!session?.user?.id) return false
  return true
}

export function canUpdateTask(session: Session | null, taskAssigneeId?: string | null): boolean {
  if (!session?.user?.id) return false
  if (taskAssigneeId && taskAssigneeId !== session.user.id) return false
  return true
}

export function canDeleteTask(session: Session | null): boolean {
  if (!session?.user?.id) return false
  return true
}

export function canAssignTask(session: Session | null): boolean {
  if (!session?.user?.id) return false
  return true
}

export function canDeleteComment(session: Session | null, commentAuthorId?: string): boolean {
  if (!session?.user?.id) return false
  if (commentAuthorId && commentAuthorId !== session.user.id) return false
  return true
}
