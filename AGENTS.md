# AGENTS.md — Working on Flipbook

Guidance for agents (and humans) developing **Flipbook**, a local-first
compositing review tool. Read this alongside `ARCHITECTURE.md` (how the code is
laid out) and `SPECIFICATION.md` (what it does and what's next).

## The one-paragraph mental model

One Next.js process is the whole app: it serves the React UI, the API routes,
streams media off local disk, and shells out to `ffmpeg`. State lives in a single
SQLite file (`data/flipbook.db`) via Drizzle; generated proxies live under
`data/media/<versionId>/`. There is no auth, no cloud, no separate services — it
binds to `127.0.0.1` and is meant to run on one workstation. Optimize for that.

## Commands

```bash
npm run dev          # dev server (http://127.0.0.1:3000)
npm run build        # production build — also full typecheck (do this before committing)
npm run lint         # eslint (must be clean)
npm run db:generate  # regenerate SQL migration after editing db/schema.ts
npm run db:migrate   # apply migrations (also happens lazily on first boot)
npx playwright test  # e2e UI tests (starts its own dev server on a temp data dir)
```

Runtime needs `ffmpeg` + `ffprobe` on `PATH`. The build/typecheck does not.

## Conventions

- **Server vs client.** Anything touching the DB, `fs`, or `ffmpeg` is server-only
  and imports `server-only`. Client components must never import `db/schema.ts`
  for a *runtime* value (it pulls `node:crypto` + `better-sqlite3` into the
  bundle) — import enums/types from `@/lib/status` instead. Type-only imports
  from schema are fine (they're erased).
- **Mutations.** In-app writes go through **server actions** in `src/app/actions.ts`
  and return `ActionResponse<T>` (`{ ok: true, data } | { ok: false, error }`).
  Never throw across the boundary; wrap bodies in `action(() => …)`.
- **External ingest** (the Nuke button / scripts) goes through `POST /api/publish`,
  validated with the Zod schema in `src/lib/publish-schema.ts`.
- **Data access** is centralized in `src/lib/repo.ts`. Don't scatter Drizzle
  queries through routes/components — add a repo function.
- **Media paths** are always derived from `versionMediaPaths(versionId)` in
  `src/lib/config.ts`. Never hardcode paths under `data/`.
- **Frames are 1-based.** Proxy frame `1` is the first rendered frame; the
  *source* frame shown to the user is `frameStart + frame - 1`. Notes anchor to
  the 1-based proxy frame.
- **Style.** Follow the surrounding code: TypeScript strict, Prettier
  (no semicolons, double quotes), Tailwind, Radix primitives in
  `src/components/ui/` (lifted verbatim — keep them domain-agnostic).

## React strictness (this repo will bite you)

The `react-hooks` lint rules here are the strict/latest set. Two rules recur:

- **`set-state-in-effect`** — don't call a `useState` setter (or an in-scope
  function that does) synchronously in an effect body. Sync props→state in an
  event handler, a `key` remount, or after an `await`.
- **`immutability`** — don't mutate a `ref.current` that is also read inside an
  effect. Prefer functional `setState(f => …)` for playback loops, and
  `useImperativeHandle` for parent→child commands (see how `Player` exposes
  `seek()`), instead of mirroring state into refs.

If you find yourself reaching for a `ref` to "read the latest value in an
effect," stop and reconsider — that's the shape both rules reject.

## Guardrails

- **Don't commit or push without being asked.** Work on a branch. Keep commits
  atomic and well-scoped (one concern each).
- **`data/` is gitignored** — never commit the DB or generated media.
- After a non-trivial change, run `npm run lint` **and** `npm run build`, and if
  it touches the review UI, run `npx playwright test`.
- Prefer editing `db/schema.ts` + `npm run db:generate` over hand-writing SQL.
