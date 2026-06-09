"use client"

import { useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"
import { deleteCommentAction } from "@/features/tasks/actions/delete-comment-action"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import type { CommentListItem } from "@/features/tasks/services/task-service"

function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { pending } = useFormStatus()

  async function handleDelete() {
    const formData = new FormData()
    formData.set("id", commentId)
    const result = await deleteCommentAction(null, formData)
    if (result.success) {
      setOpen(false)
      router.refresh()
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    )
  }

  return (
    <form action={handleDelete} className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Delete?</span>
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "..." : "Confirm"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  )
}

interface CommentListProps {
  comments: CommentListItem[]
  currentUserId?: string | null
}

export function CommentList({ comments, currentUserId }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No comments yet.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            {currentUserId === comment.author.id && (
              <DeleteCommentButton commentId={comment.id} />
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
        </div>
      ))}
    </div>
  )
}
