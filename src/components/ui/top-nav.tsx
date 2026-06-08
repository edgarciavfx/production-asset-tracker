"use client"

import { useSession } from "next-auth/react"
import { LogoutButton } from "@/features/auth/components/logout-button"
import { Menu } from "lucide-react"

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { data: session } = useSession()

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden"
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex-1 text-sm text-muted-foreground">
        Production Asset Tracker
      </div>
      {session?.user && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{session.user.name}</span>
          <LogoutButton />
        </div>
      )}
    </header>
  )
}
