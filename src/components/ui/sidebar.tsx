"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/cn"
import { canManageUsers } from "@/lib/permissions"
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Clapperboard,
  ListTodo,
  Users,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/shots", label: "Shots", icon: Clapperboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const showUsers = canManageUsers(session)

  const items = showUsers
    ? [...navItems, { href: "/users", label: "Users", icon: Users }]
    : navItems

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-background text-sidebar-foreground transition-transform duration-200 lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-accent px-6">
          <Package className="h-6 w-6" />
          <span className="text-lg font-semibold">PAT</span>
        </div>
        <nav className="space-y-1 p-4">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
