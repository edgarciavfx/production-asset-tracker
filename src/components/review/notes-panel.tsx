"use client"

import { Check, MessageSquare, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/cn"
import type { Note } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"

export interface UINote extends Omit<Note, "createdAt"> {
  createdAt: number | string
}

export function NotesPanel({
  notes,
  frameStart,
  currentFrame,
  onJump,
  onResolve,
  onDelete,
}: {
  notes: UINote[]
  frameStart: number
  currentFrame: number
  onJump: (frame: number) => void
  onResolve: (id: string, resolved: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4" />
        Notes
        <span className="ml-auto rounded bg-muted px-1.5 text-xs text-muted-foreground">
          {notes.length}
        </span>
      </div>

      {notes.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No notes yet. Step to a frame and annotate it.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-y-auto">
          {notes.map((n) => {
            const src = n.frame != null ? frameStart + n.frame - 1 : null
            const active = n.frame != null && n.frame === currentFrame
            return (
              <li
                key={n.id}
                className={cn(
                  "group px-3 py-2.5 text-sm",
                  active && "bg-accent/50",
                  n.resolved && "opacity-50"
                )}
              >
                <div className="flex items-center gap-2">
                  {src != null ? (
                    <button
                      onClick={() => onJump(n.frame!)}
                      className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-xs text-primary hover:bg-primary/25"
                    >
                      f{src}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">General</span>
                  )}
                  {n.hasDrawing && (
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <div className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title={n.resolved ? "Reopen" : "Resolve"}
                      onClick={() => onResolve(n.id, !n.resolved)}
                    >
                      <Check
                        className={cn(
                          "h-3.5 w-3.5",
                          n.resolved && "text-emerald-500"
                        )}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title="Delete"
                      onClick={() => onDelete(n.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {n.body && (
                  <p className="mt-1 whitespace-pre-wrap text-foreground/90">
                    {n.body}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
