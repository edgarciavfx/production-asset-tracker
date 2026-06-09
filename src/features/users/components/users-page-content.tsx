"use client"

import { useSession } from "next-auth/react"
import { UsersTable } from "./users-table"
import { CreateUserDialog } from "./create-user-dialog"
import { canManageUsers } from "@/lib/permissions"
import type { UserListItem, RoleOption } from "@/features/users/services/user-service"

interface UsersPageContentProps {
  users: UserListItem[]
  total: number
  roles: RoleOption[]
}

export function UsersPageContent({ users, total, roles }: UsersPageContentProps) {
  const { data: session } = useSession()
  const isAdmin = canManageUsers(session)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your team members.
          </p>
        </div>
        {isAdmin && <CreateUserDialog roles={roles} />}
      </div>

      <UsersTable
        users={users}
        total={total}
        roles={roles}
        currentUserId={session?.user?.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}
