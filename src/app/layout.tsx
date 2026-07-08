import type { Metadata } from "next"
import Link from "next/link"
import { Clapperboard } from "lucide-react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Flipbook — Compositing Review",
  description: "A personal, frame-accurate compositing review tool.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Clapperboard className="h-5 w-5 text-primary" />
              <span>Flipbook</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Comp Review
              </span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
