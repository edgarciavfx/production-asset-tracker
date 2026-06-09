"use client"

import { useFormStatus } from "react-dom"
import { createShotAction } from "@/features/shots/actions/create-shot-action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ProjectOption {
  id: string
  name: string
}

interface CreateShotDialogProps {
  projects: ProjectOption[]
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create Shot"}
    </Button>
  )
}

export function CreateShotDialog({ projects }: CreateShotDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createShotAction(null, formData)
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
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          New Shot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <input type="hidden" name="status" value="NOT_STARTED" />

          <DialogHeader>
            <DialogTitle>Create Shot</DialogTitle>
            <DialogDescription>Add a new production shot.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" placeholder="e.g. SHOT_001" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Shot description" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue="NOT_STARTED" name="status">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="COMPLETE">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select name="projectId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
