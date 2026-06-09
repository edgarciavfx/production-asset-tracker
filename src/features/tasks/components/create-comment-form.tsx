"use client"

import { useFormStatus } from "react-dom"
import { createCommentAction } from "@/features/tasks/actions/create-comment-action"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface CreateCommentFormProps {
  taskId: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Posting..." : "Post Comment"}
    </Button>
  )
}

export function CreateCommentForm({ taskId }: CreateCommentFormProps) {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createCommentAction(null, formData)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="taskId" value={taskId} />
      <div className="space-y-2">
        <Textarea
          name="body"
          placeholder="Add a comment..."
          rows={3}
          required
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </div>
    </form>
  )
}
