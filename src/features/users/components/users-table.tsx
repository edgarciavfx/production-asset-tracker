"use client"

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { EditUserDialog } from "./edit-user-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import type { UserListItem, RoleOption } from "@/features/users/services/user-service"

interface UsersTableProps {
  users: UserListItem[]
  total: number
  roles: RoleOption[]
  currentUserId?: string | null
  isAdmin: boolean
}

export function UsersTable({ users, total, roles, currentUserId, isAdmin }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-medium">No users found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first user to get started.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            {isAdmin && <TableHead className="w-24">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {user.createdAt.toLocaleDateString()}
              </TableCell>
              {isAdmin && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    <EditUserDialog user={user} roles={roles} />
                    <DeleteUserDialog
                      userId={user.id}
                      userName={user.name}
                      isSelf={currentUserId === user.id}
                    />
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t px-2 py-4">
        <p className="text-sm text-muted-foreground">
          {total} total user{total !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  )
}
