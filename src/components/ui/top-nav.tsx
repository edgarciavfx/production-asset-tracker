"use client"

import { Menu } from "lucide-react"

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden"
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="text-sm text-muted-foreground">
        Production Asset Tracker
      </div>
    </header>
  )
}
