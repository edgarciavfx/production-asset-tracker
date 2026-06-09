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

The application is designed for deployment on [Railway](https://railway.app).

### Prerequisites

- A Railway account
- The `railway` CLI installed (`npm i -g @railway/cli`)
- A `railway.json` config is already included in the project root

### Steps

1. **Create a Railway project**

   ```bash
   railway init
   ```

2. **Provision a PostgreSQL database**

   ```bash
   railway add postgres
   ```

   Railway automatically sets the `DATABASE_URL` environment variable.

3. **Set environment variables**

   ```bash
   railway variables set AUTH_SECRET="<32-char-min-secret>"
   railway variables set AUTH_URL="https://<your-project>.up.railway.app"
   ```

   Or set them in the Railway dashboard under the Variables tab.

   Required variables:
   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | Set automatically by Railway Postgres plugin |
   | `AUTH_SECRET` | Auth.js secret (min 32 characters) |
   | `AUTH_URL` | Public URL of your Railway deployment |

4. **Deploy**

   ```bash
   railway up
   ```

   Railway runs `npm run build` (triggering `postinstall` → `prisma generate`),
   then starts the app with `npx prisma migrate deploy && npm run start`.

5. **Seed the database** (first deployment only)

   After deploy succeeds, run the seed script in a Railway shell:

   ```bash
   railway run npx prisma db seed
   ```

   This creates the initial roles (Admin, Producer, Artist) and an admin user.

### Health Check

Railway monitors the `/login` endpoint for health. The app restarts automatically
if the health check fails.

### Security Headers

Production responses include security headers configured in `next.config.ts`:
- Content Security Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options (DENY)
- X-Content-Type-Options (nosniff)
- Referrer-Policy

### Verification

After deployment, verify:
- [ ] Login works at `https://<your-project>.up.railway.app/login`
- [ ] Dashboard loads correctly
- [ ] CRUD operations work (create project, asset, shot, task)
- [ ] Data persists across restarts

---

## License

MIT
