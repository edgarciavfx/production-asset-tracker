# Production Asset Tracker

Portfolio-grade production pipeline management — inspired by ShotGrid.  
Built to demonstrate professional full-stack engineering: clean architecture, type-safe code, RBAC security, and production deployment.

[![Live Demo](https://img.shields.io/badge/demo-live-2ea44f)](https://web-production-0f345.up.railway.app)
[![MIT License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## Live Demo

**URL**: [https://web-production-0f345.up.railway.app](https://web-production-0f345.up.railway.app)

| Role | Name | Email | Password |
|------|------|-------|----------|
| Admin | Alex Turner | `admin@neoncut.com` | `neoncut2024` |
| Producer | Sarah Chen | `producer@neoncut.com` | `producer123` |
| Artist | Alice Martinez | `alice@neoncut.com` | `alice123` |
| Artist | Bob Tanaka | `bob@neoncut.com` | `bob123` |

Log in as Admin to see full CRUD and user management; try Producer or Artist to test RBAC enforcement.

---

## Problem

Production teams in animation, VFX, and game development track assets, shots, and tasks across projects. The dominant solution is enterprise-grade but expensive and complex. Most studios fall back to spreadsheets, email, and ad-hoc tools — leading to missed deadlines, duplicated work, and communication breakdowns.

This application replaces ad-hoc tracking with a structured, role-aware pipeline management system — demonstrating how modern web architecture can solve a real industry problem.

---

## Features

| Feature | Description |
|---------|-------------|
| Authentication | Email/password login with session management, JWT tokens (7-day expiry), and rate-limited login (5 attempts / 15 min) |
| Role-Based Access Control | 3 roles (Admin, Producer, Artist) with 14 granular permission helpers enforced server-side on every action |
| Project Management | Full CRUD with pagination, sorting, search, filters, and cascading soft delete |
| Asset Tracking | Track characters, props, environments, and vehicles per project with status workflow |
| Shot Management | Auto-generated `SHOT_XXX` codes per project using Prisma transactions with retry; status workflow: Planning → In Progress → Review → Approved |
| Task Management | Assign tasks to assets or shots (mutually exclusive via Zod discriminated union), track status, priority (Low/Medium/High/Urgent), and threaded comments with audit logging |
| Dashboard | 5 global metrics (projects, assets, shots, active tasks, completion rate), status distribution charts (Recharts), and recent activity table |
| Search & Filtering | Global cross-entity search (projects, assets, shots, tasks) with URL-persisted combined filters |
| Audit Logging | Persisted security and mutation events — auth attempts, CRUD operations, with fire-and-forget logger |
| Soft Deletion | `deletedAt` nullable timestamp on all entity tables with cascading confirmation modal |

---

## Screenshots

| # | View | Screenshot | Key Feature |
|---|------|------------|-------------|
| 1 | **Login** | ![Login form](docs/screenshots/001.png) | Auth.js credentials, rate limiting |
| 2 | **Dashboard** | ![Dashboard metrics](docs/screenshots/002.png) | Recharts analytics, 5 key metrics |
| 3 | **Projects List** | ![Projects table](docs/screenshots/003.png) | Pagination, filters, soft delete |
| 4 | **Project Create** | ![Create dialog](docs/screenshots/004.png) | React Hook Form, Zod, Server Action |
| 5 | **Assets List** | ![Assets table](docs/screenshots/005.png) | Type badges, status workflow |
| 6 | **Shots List** | ![Shots table](docs/screenshots/006.png) | Auto-generated codes |
| 7 | **Tasks List** | ![Tasks table](docs/screenshots/007.png) | Priority badges, filters |
| 8 | **Task Detail** | ![Task detail](docs/screenshots/008.png) | Comments, XOR assignment |
| 9 | **Task Create** | ![Create task dialog](docs/screenshots/009.png) | XOR UI toggle |
| 10 | **User Management** | ![User management](docs/screenshots/010.png) | Admin-only CRUD |
| 11a | **RBAC — Producer** | ![Producer view](docs/screenshots/011-a.png) | Users tab hidden, 403 on access |
| 11b | **RBAC — Artist** | ![Artist view](docs/screenshots/011-b.png) | New/delete hidden on projects |
| 11c | **RBAC — Artist Tasks** | ![Artist tasks](docs/screenshots/011-c.png) | Only assigned tasks, no reassign |
| 12 | **Global Search** | ![Search results](docs/screenshots/012.png) | Cross-entity (projects/assets/shots/tasks) |

See [`docs/screenshot-checklist.md`](docs/screenshot-checklist.md) for detailed capture instructions.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 (App Router) | React Server Components for fast initial loads, Server Actions for colocated mutations |
| UI | React 19, Tailwind CSS v4, Shadcn/UI | Modern, accessible component library with utility-first styling |
| Charts | Recharts | Composable React charting for dashboard analytics |
| Data Fetching | TanStack Query, React Hook Form | Client cache invalidation after mutations; declarative form validation |
| Validation | Zod v4 | Type-safe runtime validation at every input boundary |
| Auth | Auth.js (Credentials + PrismaAdapter) | JWT strategy avoids database lookups on every request |
| Database | PostgreSQL + Prisma ORM | Type-safe queries with generated types; migration management |
| Language | TypeScript (strict mode) | Full type safety with `noUncheckedIndexedAccess` |
| Testing | Vitest | Fast, TypeScript-native test runner |
| Deployment | Railway | Zero-downtime deploys with automated migrations |

---

## Architecture

```
UI Components (React Server/Client Components)
    ↓
Server Actions (Zod validation → RBAC check → delegate)
    ↓
Services (business logic + Prisma queries)
    ↓
Prisma ORM (type-safe parameterized queries)
    ↓
PostgreSQL
```

Key principles:

- **No raw Prisma in components.** Components never touch the database.
- **No business logic in components.** Logic lives in services.
- **Server Actions return `ActionResponse<T>`.** Every action returns a discriminated union of success or failure — never throws.
- **Authorization enforced server-side.** Permission checks on every action, never just UI hiding.
- **Zod validates every input boundary.** Client-side and server-side validation with the same schema.
- **Feature-scoped code.** Each feature is self-contained in `features/<name>/`; promoted to shared only when 2+ features depend on it.

See [`docs/architecture-overview.md`](docs/architecture-overview.md) for the full architecture guide and diagrams.

---

## Engineering Highlights

### Type Safety

- **Strict TypeScript** with `noUncheckedIndexedAccess` — every nullable field must be handled
- **Zod runtime validation** at every mutation boundary — impossible to insert malformed data
- **Prisma generated types** ensure database schema and application code stay in sync
- **`ActionResponse<T>` discriminated union** — components exhaustively check success/failure

### Security

- **OWASP Top 10 compliance** — SQL injection (Prisma parameterization), XSS (React + CSP), CSRF (SameSite + Next.js), broken access control (server-side enforcement)
- **RBAC with 14 permission helpers** — `canCreateProject()`, `canDeleteAsset()`, `requireOwnership()`, etc., all enforced server-side
- **Rate-limited authentication** — 5 attempts per 15-minute sliding window per IP
- **Audit logging** — every auth attempt and mutation persisted to `AuditLog` table
- **Security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options configured in `next.config.ts`

### Data Integrity

- **Soft deletion** with cascading behavior — deleting a Project cascades to Assets → Tasks → Comments
- **XOR task assignment** — Zod discriminated union ensures a Task links to exactly one Asset or one Shot
- **Auto-generated shot codes** — `SHOT_XXX` codes generated in Prisma transactions with retry on collision
- **Composite indexes** on foreign keys, statuses, priorities, and search columns for query performance

### Developer Experience

- **Spec-driven development** — 11 specs implemented as independent branches, each with acceptance criteria
- **Feature-scoped code** — 73 source files across 8 features, each with `actions/`, `components/`, `schemas/`, `services/`
- **Consistent patterns** — every Server Action, service, and component follows the same structure
- **Comprehensive tests** — validation schemas, service logic, permission helpers

---

## Project Structure

```
src/
├── app/                 # Next.js App Router pages (auth, dashboard, entities)
├── components/          # Shared UI components (Shadcn/UI primitives, sidebar, topnav)
├── features/            # Feature-scoped code (8 features)
│   ├── auth/            # Login, logout, session management
│   ├── projects/        # Project CRUD, pagination, search
│   ├── assets/          # Asset CRUD, type/status management
│   ├── shots/           # Shot CRUD, code generation
│   ├── tasks/           # Task CRUD, comments, assignment
│   ├── dashboard/       # Metrics, charts, recent activity
│   ├── search/          # Cross-entity global search
│   └── users/           # User management (Admin only)
├── lib/                 # Shared utilities (Prisma, auth, RBAC, audit, rate-limit)
├── types/               # Shared TypeScript types (ActionResponse, auth augmentation)
└── middleware.ts        # Auth middleware (protects all routes except /login)
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| `ARCHITECTURE.md` | Full architectural standards, patterns, and conventions (1053 lines) |
| `SPECIFICATION.md` | Feature specifications and acceptance criteria for all 11 specs |
| `docs/architecture-overview.md` | Portfolio-friendly architecture guide with diagrams |
| `docs/deployment-guide.md` | Deployment instructions for Railway |
| `docs/engineering-decisions.md` | Key engineering decisions with rationale and trade-offs |
| `docs/lessons-learned.md` | Reflections on what went well and what to improve |
| `docs/project-summary.md` | Recruiter-facing project summary and résumé blurb |
| `docs/screenshot-checklist.md` | Detailed screenshot capture instructions for portfolio |
| `docs/system-architecture.mermaid.md` | Mermaid system architecture diagram |
| `docs/auth-flow.mermaid.md` | Mermaid authentication sequence diagram |
| `docs/rbac-flow.mermaid.md` | Mermaid RBAC authorization flow diagram |
| `docs/request-lifecycle.mermaid.md` | Mermaid request lifecycle sequence diagram |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL running locally

### Setup

```bash
pnpm install
cp .env.example .env
```

Fill in your `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pat?sslmode=require"
AUTH_SECRET="your-32-char-min-secret"
AUTH_URL="http://localhost:3000"
```

### Database

```bash
npx prisma migrate dev
npx prisma db seed
```

The seed script creates:
- 3 roles: **Admin**, **Producer**, **Artist**
- 4 demo users with realistic production data (5 projects, 13 assets, 10 shots, 23 tasks, 6 comments)

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the admin credentials above.

---

## Development

```bash
npm run dev        # Start dev server
npx vitest run     # Run tests
npm run lint       # Lint
npx tsc --noEmit   # TypeScript check
npx prisma studio  # Database UI
```

---

## Deployment

Deployed on [Railway](https://railway.app) with automated CI/CD via GitHub Actions.

**Live**: [https://web-production-0f345.up.railway.app](https://web-production-0f345.up.railway.app)

### Pipeline

| Stage | Tool | What Runs |
|-------|------|-----------|
| CI | GitHub Actions | `lint` → `typecheck` → `test` (all PRs) |
| Build | Railway Nixpacks | `npm run build` → `prisma generate` |
| Deploy | Railway | `prisma migrate deploy` → `npm run start` |
| Health | Railway | `/api/health` endpoint (60s timeout, auto-restart) |

### Security Headers

Production responses include CSP, HSTS, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy.

See [`docs/deployment-guide.md`](docs/deployment-guide.md) for full deployment instructions.

---

## License

MIT
