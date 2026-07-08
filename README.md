# Flipbook

[![CI](https://github.com/edgarciavfx/production-asset-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/edgarciavfx/production-asset-tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg)](./.nvmrc)

A personal, **ShotGrid-style review tool built for compositing only** — a
frame-accurate place to review versions of a shot, step through frames, leave
text and drawn notes, and jump straight to the Nuke script that rendered each
version.

Flipbook is **local-first**: one Next.js process serves the UI, the API, media
streaming, and the ffmpeg pipeline. Media stays on your disk, the database is a
single SQLite file, nothing is uploaded anywhere. Run one command, open a
browser.

```
Project  →  Shot  →  Version  →  frame-accurate review + notes + annotations
```

<!-- TODO: drop a screenshot or a short GIF of the review page here before sharing.
     Save it under docs/ and reference it, e.g.:
     ![Flipbook review page](docs/screenshot.png) -->

---

## How it works

Every published version is transcoded into a **numbered JPEG frame sequence**
(`0001.jpg`, `0002.jpg`, …) plus a poster thumbnail and an optional smooth-scrub
`.mp4`. The player swaps images per frame, so stepping is **perfectly
frame-accurate** — no fighting browser video seeking — and annotating is just
drawing over a static image. This also lets Flipbook ingest EXR/DPX sequences
that browsers can't play natively.

- **Frame-accurate player** — play/pause, step ±1 frame, in/out + loop, scrubber,
  live frame counter + timecode.
- **Annotations** — pen / arrow / box / ellipse drawn over the current frame,
  stored as crisp vector strokes anchored to a frame, with an optional text note.
- **Notes panel** — jump to a note's frame, mark resolved, delete.
- **Nuke link** — every version records the `.nk` snapshot that produced it;
  copy the path from the review page.

## Prerequisites

Flipbook runs on **macOS, Windows, and Linux**. You need two things:

| | Install |
|---|---|
| **Node ≥ 20** | [nodejs.org](https://nodejs.org) — or `nvm install 20` |
| **ffmpeg** (`ffmpeg` + `ffprobe`) | macOS: `brew install ffmpeg` · Windows: `winget install ffmpeg` (or `scoop install ffmpeg`) · Linux: `sudo apt install ffmpeg` (or your distro's package) |

ffmpeg is only needed at **runtime** (to transcode proxies), not to build. For
raw EXR ingest you need an ffmpeg build with OpenEXR; the Nuke button defaults to
publishing a review-friendly render (JPEG sequence or h264/ProRes `.mov`) so
ingest is robust regardless of your working format.

## Quick start

```bash
git clone https://github.com/edgarciavfx/production-asset-tracker.git flipbook
cd flipbook
npm run setup     # checks Node + ffmpeg, installs deps, builds
npm start         # http://127.0.0.1:3000
```

`npm run setup` verifies your prerequisites, installs dependencies, and produces a
production build. Then `npm start` runs it. Open **http://127.0.0.1:3000** and
you're reviewing.

Working on the code instead? Use the dev server:

```bash
npm install
npm run dev       # http://127.0.0.1:3000, with hot reload
```

The database migrates itself on first boot, so there's no manual setup step —
`npm run db:migrate` exists but is optional.

## Publishing a version

Once it's running, get a version in three ways:

- **From the UI** — open a project and click **Publish Version**, or
- **From Nuke** — see [Nuke integration](#nuke-integration) below, or
- **Over HTTP:**

  ```bash
  curl -X POST http://127.0.0.1:3000/api/publish \
    -H 'Content-Type: application/json' \
    -d '{
      "project": "Neon Cut VFX",
      "shot": "SEQ010_0020",
      "sourceType": "mov",
      "sourcePath": "/renders/SEQ010_0020_comp_v003.mov",
      "frameStart": 1001, "frameEnd": 1096, "fps": 24,
      "nukeScriptPath": "/scripts/SEQ010_0020_comp_v003.nk"
    }'
  ```

  For an image sequence use `"sourceType": "seq"` and a printf-style
  `sourcePath`, e.g. `/renders/SEQ010_0020/comp.%04d.exr`.

The version appears in the shot's version rail as its proxy transcodes
(`pending → processing → ready`), then it's ready to review.

## Running it

`npm start` serves the production build; `npm run dev` is the hot-reloading dev
server. Both bind to **127.0.0.1** by default — it's a single-user, local tool, so
it stays off your other network interfaces.

Sharing one instance across a small team on a LAN? Point it at a reachable
address and set the Nuke button's target to match:

```bash
PORT=3000 npx next start -H 0.0.0.0        # reachable on your LAN
# then in Nuke's environment: FLIPBOOK_URL=http://<your-host>:3000
```

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Purpose |
|---|---|---|
| `FLIPBOOK_DATA_DIR` | `./data` | SQLite DB + generated media proxies |
| `PORT` | `3000` | Server port (the Nuke button POSTs here) |
| `FLIPBOOK_FFMPEG` / `FLIPBOOK_FFPROBE` | `ffmpeg` / `ffprobe` | Binary paths |
| `FLIPBOOK_PROXY_WIDTH` | `1280` | Long-edge width of proxy frames |

Everything Flipbook generates lives under the data dir, so backing up or moving
the tool is just copying that folder:

```
data/flipbook.db
data/media/<versionId>/frames/0001.jpg …   # frame-accurate proxy
data/media/<versionId>/thumb.jpg           # poster
data/media/<versionId>/proxy.mp4           # optional smooth-playback proxy
```

Source masters (the rendered `.mov` / sequence) stay wherever Nuke wrote them —
the DB only stores their paths. Flipbook owns only the generated proxies.

## Nuke integration

The `nuke/` folder adds a **"Publish to Flipbook"** button to Nuke:

1. Copy `nuke/menu.py` and `nuke/flipbook_publish.py` into `~/.nuke`
   (or add the `nuke/` directory to your `NUKE_PATH`).
2. In Nuke, select your Write node and run **Flipbook → Publish to Flipbook**
   (or press `F8`).

On publish it snapshots the current script (content-fingerprinted with
`hashlib`), reads the Write node's output path, frame range, and project fps, and
POSTs to `http://127.0.0.1:3000/api/publish`. It uses only Python's standard
library, so it runs in Nuke's bundled Python with no `pip install`.

Optional environment overrides (set in Nuke's environment):
`FLIPBOOK_URL`, `FLIPBOOK_PROJECT`, `FLIPBOOK_SHOT`, `FLIPBOOK_SNAPSHOTS`.

You can validate the publish script without Nuke:

```bash
python nuke/flipbook_publish.py --fixture payload.json
```

## Troubleshooting

- **`npm install` tries to compile `better-sqlite3`.** It normally installs a
  prebuilt binary for Node 20 on common platforms. If it falls back to building
  from source you'll need a compiler toolchain: Xcode Command Line Tools (macOS),
  Visual Studio Build Tools (Windows), or `build-essential` + `python3` (Linux).
- **"ffmpeg not found" when publishing.** Make sure `ffmpeg` and `ffprobe` are on
  your `PATH`, or point `FLIPBOOK_FFMPEG` / `FLIPBOOK_FFPROBE` at their full paths.
- **Port 3000 in use.** Start with a different `PORT`, e.g. `PORT=3100 npm start`.

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · SQLite + Drizzle ORM
(`better-sqlite3`) · Tailwind v4 + Radix primitives · system `ffmpeg` via
`child_process`.

## Data model

```
project   id, name, description
shot      id, projectId, code, description, status
version   id, shotId, number (v001…), label, status,
          sourceType (mov|seq), sourcePath, seqPattern, frameStart, frameEnd, fps,
          nukeScriptPath, renderedAt, proxyStatus, frameCount, hasMp4
note      id, versionId, frame (nullable = general), body, drawing (vector JSON),
          resolved
```

Statuses are compositing-flavored: `WIP → NEEDS_REVIEW → APPROVED → REJECTED`.

## License

[MIT](./LICENSE) — free to try, fork, and adapt. Issues and PRs welcome.
