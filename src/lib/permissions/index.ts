import type { Session } from "next-auth"

export function requireAuth(session: Session | null): asserts session is Session & { user: { id: string; role: string } } {
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
}

function isAdmin(session: Session | null): boolean {
  return session?.user?.role === "Admin"
}

function isProducer(session: Session | null): boolean {
  return session?.user?.role === "Producer"
}

function isArtist(session: Session | null): boolean {
  return session?.user?.role === "Artist"
}

function isAdminOrProducer(session: Session | null): boolean {
  return isAdmin(session) || isProducer(session)
}

export function canManageUsers(session: Session | null): boolean {
  return isAdmin(session)
}

export function canDeleteAnyRecord(session: Session | null): boolean {
  return isAdmin(session)
}

export function canCreateProject(session: Session | null): boolean {
  return isAdminOrProducer(session)
}

export function canUpdateProject(session: Session | null): boolean {
  return isAdminOrProducer(session)
}

export function canDeleteProject(session: Session | null): boolean {
  return isAdmin(session)
}

export function canCreateAsset(session: Session | null): boolean {
  return isAdminOrProducer(session)
}

export function canUpdateAsset(session: Session | null): boolean {
  return isAdminOrProducer(session)
}

export function canDeleteAsset(session: Session | null): boolean {
  return isAdmin(session)
}

export function canCreateShot(session: Session | null): boolean {
  return isAdminOrProducer(session)
}

export function canUpdateShot(session: Session | null): boolean {
  return isAdminOrProducer(session)
}

export function canDeleteShot(session: Session | null): boolean {
  return isAdmin(session)
}

export function canCreateTask(session: Session | null): boolean {
  return isAdminOrProducer(session)
}

export function canUpdateTask(session: Session | null, taskAssigneeId?: string | null): boolean {
  if (isAdmin(session) || isProducer(session)) return true
  if (isArtist(session) && taskAssigneeId && session?.user?.id) {
    return taskAssigneeId === session.user.id
  }
  return false
}

export function canDeleteTask(session: Session | null): boolean {
  return isAdmin(session)
}

export function canAssignTask(session: Session | null): boolean {
  return isAdminOrProducer(session)
}

export function canDeleteComment(session: Session | null, commentAuthorId?: string): boolean {
  if (isAdmin(session)) return true
  if (commentAuthorId && session?.user?.id) {
    return commentAuthorId === session.user.id
  }
  return false
}
