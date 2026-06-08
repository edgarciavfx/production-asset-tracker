# AGENTS.md — Development Workflow

## Overview

- **Model:** DeepSeek V4 Flash Free (via opencode)
- **Source of truth:** `ARCHITECTURE.md` (rules) + `SPECIFICATION.md` (features)
- **Rule:** One spec → one branch → one PR → merge → repeat
- **Git safety:** opencode will not commit or push without the user's explicit authorization. The user must opt in at the start of each spec session.

## Prerequisites

- Node.js, pnpm, PostgreSQL running locally
- `gh` CLI authenticated
- `.env` file in project root (see `.env.example`)
- All previous specs merged to `main`

## Spec Order

Implement strictly in this order. Later specs depend on earlier ones.

| # | Branch | Depends On | Description |
|---|--------|------------|-------------|
| 1 | `spec/1-foundation` | — | Project init, layout, placeholder pages |
| 2 | `spec/2-database` | 1 | Prisma schema, migrations, seed |
| 3 | `spec/3-auth` | 1, 2 | Login, logout, session, middleware |
| 4 | `spec/4-projects` | 2, 3 | Project CRUD, search, filters |
| 5 | `spec/5-assets` | 2, 3, 4 | Asset CRUD, project linkage |
| 6 | `spec/6-shots` | 2, 3, 4 | Shot CRUD, project linkage |
| 7 | `spec/7-tasks` | 2, 3, 4, 5, 6 | Task CRUD, assignment |
| 8 | `spec/8-dashboard` | 2, 3, 4, 5, 6, 7 | Metrics, charts, recent tasks |
| 9 | `spec/9-search-filtering` | 2, 3, 4, 5, 6, 7 | Global search, combined filters |
| 10 | `spec/10-rbac` | 2, 3, 4, 5, 6, 7 | Role enforcement, permission helpers |
| 11 | `spec/11-deployment` | 1–10 | Railway deployment, env config |

## Per-Spec Workflow

### 1. User authorizes session

```
User: "Implement spec N. Follow AGENTS.md."
```

This authorizes the agent to branch, implement, test, commit, push, and create a PR for spec N.

### 2. Agent implements

```
1. git checkout main && git pull origin main
2. git checkout -b spec/N-name

3. Read ARCHITECTURE.md — follow all rules
4. Read the relevant section of SPECIFICATION.md

5. Implement the feature:
   - Server Actions return ActionResponse<T>
   - Zod validation on all input
   - Server-side authorization on every action
   - Business logic in services
   - Feature code in features/<name>/ (promote to shared only when 2+ features need it)
   - No raw Prisma in components
   - cn() for Tailwind class merging
   - date-fns for date formatting
   - Install required new dependencies per spec (e.g., @auth/prisma-adapter for auth, recharts for dashboard)

6. Test: npx vitest run
7. Lint: npm run lint
8. Typecheck: npx tsc --noEmit

9. Verify acceptance criteria in SPECIFICATION.md §N
10. Report any assumptions or deviations

11. git add -A && git commit -m "spec/N: description"
12. git push -u origin HEAD
13. gh pr create --title "Spec N: Name" --body "Implements SPECIFICATION.md §N."
```

### 3. User reviews PR

Agent reports the PR URL. User reviews on GitHub.

### 4. User triggers merge

```
User: "Merge spec N."
```

Agent runs `gh pr merge --squash`.

### 5. Repeat

Proceed to spec N+1.

## Rules for the Agent

- Implement exactly one spec per branch. Never scope-creep.
- Never skip acceptance criteria.
- Read ARCHITECTURE.md at the start of every new branch.
- If a dependency isn't merged yet, stop and report it.
- If a decision isn't covered by ARCHITECTURE.md or SPECIFICATION.md, ask the user.
- Report all modified files at the end of implementation.

## Commands Reference

| Action | Command |
|--------|---------|
| Run dev server | `npm run dev` |
| Run tests | `npx vitest run` |
| Lint | `npm run lint` |
| TypeScript check | `npx tsc --noEmit` |
| Prisma migrate dev | `npx prisma migrate dev` |
| Prisma migrate deploy | `npx prisma migrate deploy` |
| Prisma studio | `npx prisma studio` |
| Create PR | `gh pr create --title "..." --body "..."` |
| Merge PR | `gh pr merge --squash` |
