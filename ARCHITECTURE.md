# Architecture

How Flipbook is built. For product scope and roadmap see `SPECIFICATION.md`; for
day-to-day conventions see `AGENTS.md`.

## Principles

1. **One process, local-first.** The Next.js server *is* the app — UI, API, media
   streaming, and the ffmpeg pipeline all run in it. No DB server, no object
   store, no auth. It binds to `127.0.0.1`.
2. **The DB owns pointers, not pixels.** Source renders stay where Nuke wrote
   them; SQLite stores their paths. Flipbook owns only the *generated* proxies
   under `data/media/`, which are disposable and re-buildable from source.
3. **Frame-accuracy over video.** Playback is a numbered JPEG sequence, not an
   HTML5 `<video>`. Swapping images per frame is exact, annotation-friendly, and
   format-agnostic (EXR/DPX sources that browsers can't decode still work).

## Layers

```
Browser (React 19, client components)
  │  server actions (mutations)          fetch (media, polling)
  ▼                                        ▼
Server actions  ──►  repo.ts  ──►  Drizzle  ──►  SQLite (data/flipbook.db)
(src/app/actions.ts)   ▲
                       │
API routes  ───────────┘         Route handlers stream files from data/media/
(src/app/api/*)                  and enqueue proxy jobs.
                       │
                       ▼
              proxy worker  ──►  ffmpeg / ffprobe (child_process)
              (src/lib/proxy)     writes data/media/<versionId>/…
```

- **Reads** happen in server components (pages) calling `repo.ts` directly, and
  in the browser via `GET` routes for media + status/notes polling.
- **In-app writes** are server actions returning `ActionResponse<T>`.
- **External writes** (Nuke, curl) are `POST /api/publish`.

## The publish → proxy → review flow

1. `POST /api/publish` (or `manualPublishAction`) validates the payload
   (`publish-schema.ts`), then `ingestVersion()` finds-or-creates the project and
   shot, inserts a `version` row (`proxyStatus: "pending"`), and calls
   `enqueueProxyJob(version.id)`.
2. The **proxy worker** (`src/lib/proxy/worker.ts`) is a single-job in-process
   queue. It flips the version to `processing`, runs ffmpeg to write
   `frames/%04d.jpg`, derives a `thumb.jpg` from the middle frame, and best-effort
   builds `proxy.mp4`. On success it records `frameCount` + `hasMp4` and sets
   `ready`; on failure it stores `proxyError` and sets `failed`.
3. The shot page (`/shots/[id]`) renders `ShotReview`, which **polls**
   `/api/versions/[id]/status` for any non-ready version and swaps in the player
   once it's `ready`.
4. The **player** (`Player`) preloads every frame as an `Image`, then swaps a
   single `<img>` src per frame. It owns the playhead; the parent observes it via
   `onFrame` and drives jumps via the imperative `seek()` handle.
5. **Annotations** are drawn on an SVG overlay sized to the displayed frame,
   captured as normalized (0–1) vector strokes, and saved as a `note` anchored to
   the current frame (`createNoteAction`). Saved strokes for the current frame are
   re-rendered read-only over the image.

## Directory map

```
src/
  app/
    layout.tsx, page.tsx            # shell + projects landing
    projects/[id]/page.tsx          # shots in a project
    shots/[id]/page.tsx             # loads data → <ShotReview/>
    actions.ts                      # all server actions (ActionResponse<T>)
    api/
      publish/                      # external ingest (Zod-validated)
      media/frame|thumb|mp4/…       # media streaming (mp4 is range-enabled)
      versions/[id]/status|notes/   # client polling endpoints
  components/
    ui/                             # domain-agnostic Radix primitives (lifted)
    review/                         # Player, ShotReview, NotesPanel, VersionRail,
                                    #   annotation surface (draw + render)
    *-dialog.tsx, status-pill.tsx   # project/shot/publish dialogs
  lib/
    config.ts                       # data dir, ports, ffmpeg paths, media paths
    status.ts                       # client-safe enums (ShotStatus, ProxyStatus…)
    db/{schema,index,migrate}.ts    # Drizzle schema, client, migration runner
    repo.ts                         # all DB queries
    ingest.ts, publish-schema.ts    # publish orchestration + validation
    proxy/{ffmpeg,worker}.ts        # transcode pipeline
    media-response.ts               # file + HTTP-range streaming helpers
    annotations.ts, action-response.ts, format.ts
nuke/                               # stdlib-only Nuke publish button
drizzle/                            # generated SQL migrations (committed)
e2e/                                # Playwright UI tests
data/                               # gitignored: SQLite DB + generated proxies
```

## Key decisions & their consequences

- **SQLite + `better-sqlite3` (synchronous).** Perfect for a single-user local
  tool; queries in `repo.ts` are synchronous, so server components read without
  `await`. Marked `serverExternalPackages` so Next never bundles the native addon.
- **Migrate on boot.** `db/index.ts` runs pending migrations once per process, so
  a fresh checkout "just works" with `npm run dev`. `npm run db:migrate` is the
  explicit escape hatch (CI, resets).
- **Enums split into `lib/status.ts`.** Keeps `node:crypto`/native deps out of the
  client bundle while letting the UI use `ShotStatus`/`ProxyStatus` at runtime.
- **Player owns its playhead.** Functional `setState` for the rAF playback loop
  and a `useImperativeHandle` `seek()` avoid ref-mirroring — required by the
  strict `react-hooks` rules and simply cleaner (see `AGENTS.md`).
- **Single-job proxy queue.** One ffmpeg at a time keeps CPU predictable and
  status trivial to reason about. Jobs are in-memory: a version stuck
  `pending`/`processing` after a restart is re-runnable via the "Retry" button
  (`reprocessVersionAction`).

## Extension points

- **New status / workflow state:** add to `SHOT_STATUS` in `lib/status.ts`, style
  it in `STATUS_META` (`lib/format.ts`), regenerate the migration.
- **New annotation tool:** extend `strokeSchema.tool` (`lib/annotations.ts`) and
  add a case to `StrokeShape` + the `TOOLS` toolbar.
- **New source format:** teach `proxy/worker.ts` how to feed it to ffmpeg; the
  rest of the pipeline is format-agnostic once frames exist.
- **A/B compare, reveal-in-OS, Tauri wrapper:** see the roadmap in
  `SPECIFICATION.md`.
