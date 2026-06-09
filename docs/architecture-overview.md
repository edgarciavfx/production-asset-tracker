# Architecture Overview

## System Context

Production Asset Tracker is a full-stack SaaS application for production pipeline management. It follows a strict 4-layer architecture that separates concerns at every level — from the browser to the database.

---

## Layered Architecture

```
┌─────────────────────────────────────────────┐
│           UI Components                     │
│  React Server Components (pages, layouts)   │
│  React Client Components (forms, tables)    │
│  TanStack Query (client-side cache)         │
├─────────────────────────────────────────────┤
│          Server Actions                     │
│  Input validation (Zod)                     │
│  Permission checks (RBAC helpers)           │
│  Rate limiting (auth)                       │
│  Returns ActionResponse<T>                  │
├─────────────────────────────────────────────┤
│            Services                         │
│  Business logic (no Prisma in components)   │
│  Orchestrates data access                   │
│  Audit logging                              │
├─────────────────────────────────────────────┤
│          Prisma ORM                         │
│  Type-safe queries                          │
│  Migration management                       │
├─────────────────────────────────────────────┤
│          PostgreSQL                         │
│  9 tables, 6 enums, comprehensive indexes   │
└─────────────────────────────────────────────┘
```

### Layer Rules

| Layer | Responsibility | Bans |
|-------|----------------|------|
| UI Components | Render, user interaction | Direct database access, business logic |
| Server Actions | Validate, authorize, delegate | Prisma queries, complex logic |
| Services | Business logic, data orchestration | HTTP concerns, rendering |
| Prisma | Type-safe data access | Business logic |

---

## Feature Organization

Code is organized by feature, not by type. Each feature is self-contained:

```
features/<name>/
├── actions/       # Server Actions (validate → authorize → call service)
├── components/    # React components scoped to this feature
├── schemas/       # Zod validation schemas
├── services/      # Business logic and Prisma queries
└── __tests__/     # Unit tests
```

Code is promoted to shared directories (`lib/`, `components/ui/`, `types/`) only when two or more features depend on it.

### Features

| Feature | Description |
|---------|-------------|
| `auth` | Login, logout, session management, rate limiting |
| `projects` | Project CRUD, pagination, search, filters, soft delete |
| `assets` | Asset CRUD per project, type categorization, status workflow |
| `shots` | Shot CRUD, auto-generated shot codes, status workflow |
| `tasks` | Task CRUD, XOR assignment (asset or shot), comments, priorities |
| `dashboard` | Global metrics, status charts, recent activity |
| `search` | Global search across 4 entities |
| `users` | User management (Admin only), role assignment |

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

Key relationships:
- A Project has many Assets and Shots
- An Asset or Shot has many Tasks (mutually exclusive — a Task belongs to exactly one)
- A Task has many Comments
- A User has many Tasks (as assignee) and Comments (as author)

---

## Data Flow

### Read path (initial page load)

```
Browser → Next.js Server Component → Service → Prisma → PostgreSQL
                                                              ↓
Browser ← RSC payload (serialized) ← Service ← Prisma ←──────┘
```

### Write path (user action)

```
Browser form → useActionState → Server Action
                                      ↓
                              Zod validation
                                      ↓
                              Permission check
                                      ↓
                              Service method
                                      ↓
                              Prisma mutation
                                      ↓
                              Audit log
                                      ↓
                              ActionResponse<T>
                                      ↓
Browser ← TanStack Query invalidation ← UI update
```

---

## Security Architecture

### Authentication
- Auth.js Credentials provider with JWT strategy (7-day expiry)
- bcrypt password hashing
- Rate limiting: 5 attempts per 15 minutes per IP
- Next.js middleware protects all routes except `/login` and `/api`

### Authorization (RBAC)
- 3 roles: Admin, Producer, Artist
- 14 granular permission helpers enforced server-side on every action
- UI hiding as secondary defense (never the sole control)
- Ownership checks for Artist-level operations

### OWASP Top 10 Coverage

| Category | Implementation |
|----------|---------------|
| A01: Broken Access Control | Server-side permission helpers on every action |
| A02: Cryptographic Failures | bcrypt for passwords, JWT for sessions |
| A03: Injection | Prisma parameterized queries, Zod input validation |
| A04: Insecure Design | Rate limiting on auth, soft delete safety |
| A05: Security Misconfiguration | CSP, HSTS, security headers in next.config.ts |
| A06: Vulnerable Components | Dependabot for npm/GitHub Actions |
| A07: Auth Failures | Rate limiting, session expiry, credential validation |
| A08: Integrity Failures | Audit logging for all mutations |
| A09: Logging Failures | AuditLog table for auth + mutation events |
| A10: SSRF | Next.js built-in protections |

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Server Actions over API routes | Colocate mutation logic with UI; single POST request per action; no manual HTTP handling |
| `ActionResponse<T>` pattern | Every action returns a typed discriminated union — never throws; predictable error handling |
| Feature-scoped code | Easier to navigate, delete, or extract features; clear ownership boundaries |
| Prisma enums | Database-level enforcement; auto-generated TypeScript types; impossible to insert invalid states |
| Soft deletion | `deletedAt` nullable timestamp on all entity tables; cascading confirmation; data recovery option |
| Auth.js Credentials | Simpler than OAuth for demo; JWT strategy avoids database lookups on every request |

---

## Development Workflow

Each feature was implemented as a separate branch following spec-driven development:

1. Read `SPECIFICATION.md` section
2. Create branch `spec/N-name`
3. Implement (actions, services, components, schemas, tests)
4. `npx vitest run && npm run lint && npx tsc --noEmit`
5. Verify acceptance criteria, commit, push
6. Create PR → review → squash merge

This ensured each spec was independently testable and reviewable.
