# Specification

What Flipbook does, its data model and API, and what's built vs. planned. For how
it's implemented see `ARCHITECTURE.md`.

## Product

A personal, ShotGrid-style review tool focused **only on compositing**: a
frame-accurate place to review versions of a shot, step through frames, leave
text and drawn notes, and jump to the exact Nuke script that rendered each
version. Local-first, single-user, no cloud.

Hierarchy: **Project → Shot → Version → Note.**

## Data model

```
project   id, name, description, createdAt
shot      id, projectId→project, code, description, status, createdAt
version   id, shotId→shot, number (auto v001/v002… per shot), label, status,
          sourceType ('mov'|'seq'), sourcePath, seqPattern, frameStart, frameEnd, fps,
          nukeScriptPath, renderedAt,
          proxyStatus ('pending'|'processing'|'ready'|'failed'), proxyError,
          frameCount, hasMp4, createdAt
note      id, versionId→version, frame (nullable = general note),
          body (nullable), drawing (vector-stroke JSON, nullable),
          hasDrawing, resolved, createdAt
```

- **Status** (shots + versions): `WIP → NEEDS_REVIEW → APPROVED → REJECTED`.
- **version.number** auto-increments per shot.
- **note.drawing** is vector strokes normalized 0–1 against the frame (crisp at
  any size), anchored to a 1-based proxy `frame`.
- On-disk media layout (all under `FLIPBOOK_DATA_DIR`, default `./data`):

  ```
  data/flipbook.db
  data/media/<versionId>/frames/0001.jpg …   # frame-accurate proxy
  data/media/<versionId>/thumb.jpg           # poster
  data/media/<versionId>/proxy.mp4           # optional smooth-playback proxy
  ```

## API surface

Route handlers (external + streaming) plus server actions (in-app CRUD).

| Endpoint | Purpose |
|---|---|
| `POST /api/publish` | Ingest a version (Nuke button / curl). Zod-validated. Creates the version `pending` and enqueues the proxy job. Returns id + review URL. |
| `GET /api/media/frame/[versionId]/[n]` | One proxy JPEG (immutable cache). |
| `GET /api/media/thumb/[versionId]` | Poster thumbnail. |
| `GET /api/media/mp4/[versionId]` | mp4 stream with HTTP `Range` support (206). |
| `GET /api/versions/[id]/status` | Proxy job status for polling. |
| `GET /api/versions/[id]/notes` | Notes for a version (client refresh). |

Server actions (`src/app/actions.ts`): create project / shot, manual publish,
set shot & version status, reprocess proxy, create / resolve / delete note. All
return `ActionResponse<T>`.

## UI

- **Projects landing** — grid of projects with shot counts.
- **Project page** — shots list with latest-version + status, "New Shot" and
  "Publish Version" (manual ingest, same payload as Nuke).
- **Shot / review page** — the heart:
  - Version rail: thumbnails with status pill, v-number, date, and live proxy
    status; click to switch (updates `?v=` for shareable links).
  - Frame-accurate player: play/pause, step ±1 (arrows), in/out + loop, scrubber,
    frame counter + timecode. Keyboard: `Space`, `←`/`→`, `Home`/`End`, `I`/`O`,
    `L`.
  - Annotation overlay: pen / arrow / box / ellipse, color, undo/clear; saved as a
    vector note on the current frame, with an optional text body.
  - Notes panel: per-frame notes, click to jump, resolve, delete.
  - Version status switcher + "Copy .nk path".

## Nuke integration

`nuke/menu.py` + `nuke/flipbook_publish.py` (stdlib only, runs in Nuke's bundled
Python). On publish it snapshots the current `.nk` (content-fingerprinted with
`hashlib`), reads the Write node's output path + frame range + fps, and POSTs to
`/api/publish` via `urllib`. `--fixture` mode exercises snapshot + POST without
Nuke. See `README.md` for install.

## Build status

| # | Phase | Status |
|---|---|---|
| 1 | Scaffold (Next + Drizzle/SQLite + config + shell) | ✅ Done |
| 2 | Data model + CRUD + range-streaming media | ✅ Done |
| 3 | Ingest + ffmpeg proxy pipeline (mov + seq) | ✅ Done |
| 4 | Review viewer (player, transport, shortcuts, rail) | ✅ Done |
| 5 | Notes & annotations (text + vector overlay) | ✅ Done |
| 6 | Nuke publish button + README | ✅ Done |
| 7 | Verification (curl + Playwright e2e) | ✅ Done |

## Roadmap (nice-to-have)

- **A/B version compare** — side-by-side or wipe between two versions of a shot,
  synced playheads.
- **Reveal `.nk` / render in OS file manager** — a small local helper (browsers
  can't open `file://` from `http://`); natural fit for the Tauri wrapper.
- **Flattened annotation thumbnails** — currently drawings render live from vector
  JSON (crisper, zero extra files); a baked PNG per note would speed very long
  note lists.
- **Status workflow polish** — filters, "needs-review" queues across shots.
- **Tauri wrapper** — native window, no terminal, native file-reveal; the web app
  is already self-contained so this is packaging, not a rewrite.
- **EXR robustness** — best-effort today (needs an OpenEXR-enabled ffmpeg); the
  Nuke button sidesteps it by publishing review-friendly renders.
