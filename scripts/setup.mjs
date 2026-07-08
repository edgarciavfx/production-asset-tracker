#!/usr/bin/env node
// Cross-platform bootstrap for Flipbook: checks prerequisites, installs deps,
// and builds — so a new machine goes from `git clone` to `npm start` in one
// command. Uses only Node built-ins so it runs before `npm install`.

import { execFileSync, spawnSync } from "node:child_process"

const BOLD = "\x1b[1m"
const DIM = "\x1b[2m"
const GREEN = "\x1b[32m"
const YELLOW = "\x1b[33m"
const RED = "\x1b[31m"
const RESET = "\x1b[0m"

const ok = (m) => console.log(`${GREEN}✓${RESET} ${m}`)
const warn = (m) => console.log(`${YELLOW}!${RESET} ${m}`)
const step = (m) => console.log(`\n${BOLD}${m}${RESET}`)

// ffmpeg install hints per platform. The Nuke button can also publish a
// review-friendly render, so ffmpeg is only needed at runtime, not to build.
const FFMPEG_HINTS = {
  darwin: "brew install ffmpeg",
  win32: "winget install ffmpeg    (or: scoop install ffmpeg)",
  linux: "sudo apt install ffmpeg    (or dnf/pacman: 'ffmpeg')",
}

/** True if `bin` runs (resolved from PATH or an absolute override path). */
function onPath(bin) {
  try {
    execFileSync(bin, ["-version"], { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" })
  if (res.status !== 0) {
    console.error(`\n${RED}✗ \`${cmd} ${args.join(" ")}\` failed${RESET}`)
    process.exit(res.status ?? 1)
  }
}

console.log(`${BOLD}Flipbook setup${RESET} ${DIM}— checking prerequisites${RESET}`)

// 1. Node version — must satisfy engines (>=20) / .nvmrc.
step("Node")
const major = Number(process.versions.node.split(".")[0])
if (major < 20) {
  console.error(
    `${RED}✗ Node ${process.versions.node} — Flipbook needs Node 20 or newer.${RESET}\n` +
      `  Install it from https://nodejs.org or via nvm, then re-run this.`
  )
  process.exit(1)
}
ok(`Node ${process.versions.node}`)

// 2. ffmpeg / ffprobe — respect the same overrides src/lib/config.ts reads.
step("ffmpeg")
const ffmpeg = process.env.FLIPBOOK_FFMPEG ?? "ffmpeg"
const ffprobe = process.env.FLIPBOOK_FFPROBE ?? "ffprobe"
const haveFfmpeg = onPath(ffmpeg)
const haveFfprobe = onPath(ffprobe)
if (haveFfmpeg && haveFfprobe) {
  ok(`${ffmpeg} + ${ffprobe} found`)
} else {
  const hint = FFMPEG_HINTS[process.platform] ?? "install ffmpeg from https://ffmpeg.org"
  warn(
    `${!haveFfmpeg ? ffmpeg : ffprobe} not found on PATH.\n` +
      `  ffmpeg is needed at runtime to transcode proxies (not to build).\n` +
      `  Install it before publishing a version:  ${BOLD}${hint}${RESET}\n` +
      `  (or set FLIPBOOK_FFMPEG / FLIPBOOK_FFPROBE to their full paths)`
  )
}

// 3. Install + build.
step("Installing dependencies")
run("npm", ["install"])

step("Building")
run("npm", ["run", "build"])

console.log(
  `\n${GREEN}${BOLD}Setup complete.${RESET}\n` +
    `  Start Flipbook:  ${BOLD}npm start${RESET}\n` +
    `  Then open:       ${BOLD}http://127.0.0.1:3000${RESET}\n`
)
