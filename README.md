# Production Asset Tracker

Portfolio-grade production pipeline management — inspired by ShotGrid.  
Built as a demonstration of modern full-stack engineering for hiring evaluation.

---

## What This Is

A SaaS application that tracks production assets, shots, tasks, and assignments across projects. Designed to show recruiters and hiring managers evidence of professional software engineering capability: clean architecture, type-safe code, relational database design, authentication and authorization, dashboard analytics, and production deployment.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS, Shadcn/UI, Recharts |
| Data | TanStack Query, React Hook Form, Zod |
| Auth | Auth.js (Credentials provider + PrismaAdapter) |
| Database | PostgreSQL + Prisma ORM |
| Language | TypeScript (strict mode) |
| Testing | Vitest |
| Deployment | Railway |

---

## Architecture

```
UI Components (React Server/Client Components)
    ↓
Server Actions (input validation + permission checks)
    ↓
Services (business logic + database access)
    ↓
Prisma ORM (type-safe queries)
    ↓
PostgreSQL
```

Key principles:

- **No raw Prisma in components.** Components never touch the database.
- **No business logic in components.** Logic lives in services.
- **Server Actions return `ActionResponse<T>`.** Every action returns a discriminated union of success or failure.
- **Authorization enforced server-side.** Permission checks on every action, never just UI hiding.
- **Zod validates every input boundary.** Client-side and server-side validation.

See `ARCHITECTURE.md` for the full architectural standards and conventions.

---

## Domain Model

```
Role (Admin / Producer / Artist)
 └─ User
     ├─ Tasks (assigned)
     └─ Comments (authored)

Project
 ├─ Assets
 │    └─ Tasks
 └─ Shots
      └─ Tasks

Task
 └─ Comments
```

---

## Features

| Feature | Description |
|---------|-------------|
| Authentication | Email/password login with session management and protected routes |
| Role-Based Access Control | Admin, Producer, and Artist roles with enforced permissions |
| Project Management | Full CRUD with pagination, sorting, search, filters, soft delete |
| Asset Tracking | Track characters, props, environments, vehicles per project |
| Shot Management | Auto-generated shot codes with status workflows |
| Task Management | Assign tasks to assets or shots, track status, priority, and comments |
| Dashboard | Global metrics, status distribution charts, recent activity |
| Search & Filtering | Global search and combined filters across all entities |
| Audit Logging | Security event persistence for auth attempts and mutations |
| Soft Deletion | Cascading soft delete with irreversible confirmation |

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

### Run

```bash
npm run dev
```

---

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── actions/             # Cross-cutting Server Actions
├── components/          # Shared UI components
│   ├── ui/              # Shadcn/UI primitives
│   ├── projects/
│   ├── assets/
│   ├── shots/
│   ├── tasks/
│   └── dashboard/
├── features/            # Feature-scoped code (actions, services, schemas, components)
│   ├── auth/
│   ├── projects/
│   ├── assets/
│   ├── shots/
│   ├── tasks/
│   └── dashboard/
├── services/            # Cross-cutting business logic
├── lib/                 # Shared utilities
│   ├── prisma/          # Prisma client
│   ├── auth/            # Auth.js configuration
│   ├── audit/           # Audit logging
│   ├── permissions/     # RBAC helpers
│   ├── cn.ts            # Tailwind class merging
│   ├── date.ts          # Date formatting (date-fns)
│   └── format.ts        # Number and status label formatting
├── hooks/               # Shared React hooks
├── schemas/             # Shared Zod schemas
├── types/               # Shared TypeScript types
└── constants/           # Shared constants and enums
```

Feature code stays self-contained inside `features/<name>/`. Code is promoted to top-level shared directories only when two or more features depend on it.

---

## Documentation

| Document | Purpose |
|----------|---------|
| `ARCHITECTURE.md` | Architectural standards, implementation patterns, and conventions |
| `SPECIFICATION.md` | Feature specifications and acceptance criteria |
| `AGENTS.md` | Development workflow for spec-driven implementation |

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

Deployed to Railway. See `SPECIFICATION.md §11` for environment configuration and deployment steps.

---

## License

MIT
