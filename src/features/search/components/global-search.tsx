"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { globalSearchAction } from "@/features/search/actions/search-action"
import type { SearchResults } from "@/features/search/services/search-service"

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null!)
  const dropdownRef = useRef<HTMLDivElement>(null!)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined!)

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const res = await globalSearchAction(q)
    if (res.success) {
      setResults(res.data)
    } else {
      setResults(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, performSearch])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelect(href: string) {
    setOpen(false)
    setQuery("")
    setResults(null)
    router.push(href)
  }

  const hasResults =
    results &&
    (results.projects.length > 0 ||
      results.assets.length > 0 ||
      results.shots.length > 0 ||
      results.tasks.length > 0)

  const showDropdown = open && (loading || hasResults || (query.trim() && !loading && !hasResults))

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder="Search projects, assets, shots, tasks..."
        className="pl-8"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false)
            inputRef.current?.blur()
          }
        }}
      />
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-background shadow-lg"
        >
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && hasResults && (
            <div className="py-1">
              {results!.projects.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Projects
                  </div>
                  {results!.projects.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                    >
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {results!.assets.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Assets
                  </div>
                  {results!.assets.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.sublabel}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {results!.shots.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Shots
                  </div>
                  {results!.shots.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.sublabel}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {results!.tasks.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tasks
                  </div>
                  {results!.tasks.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.sublabel}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && query.trim() && !hasResults && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  )
}
