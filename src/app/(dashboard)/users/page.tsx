import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { userService } from "@/features/users/services/user-service"
import { UsersPageContent } from "@/features/users/components/users-page-content"

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [result, roles] = await Promise.all([
    userService.listUsers(),
    userService.listRoles(),
  ])

  return (
    <UsersPageContent
      users={result.users}
      total={result.total}
      roles={roles}
    />
  )
}
