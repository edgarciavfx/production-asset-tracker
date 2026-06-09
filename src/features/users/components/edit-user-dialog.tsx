"use client"

import { useFormStatus } from "react-dom"
import { updateUserAction } from "@/features/users/actions/update-user-action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { UserListItem, RoleOption } from "@/features/users/services/user-service"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  )
}

interface EditUserDialogProps {
  user: UserListItem
  roles: RoleOption[]
}

export function EditUserDialog({ user, roles }: EditUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await updateUserAction(null, formData)
    if (result.success) {
      setOpen(false)
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <input type="hidden" name="id" value={user.id} />

          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={user.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={user.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" name="password" type="password" placeholder="Leave blank to keep current" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleId">Role</Label>
              <Select name="roleId" defaultValue={user.role.id}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
