import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Flipbook is a single-user, localhost-bound tool. better-sqlite3 is a native
  // module and the ffmpeg bridge is server-only — keep them external so Next
  // never tries to bundle them into a route.
  serverExternalPackages: ["better-sqlite3"],
}

export default nextConfig
