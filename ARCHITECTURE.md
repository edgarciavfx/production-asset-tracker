# ARCHITECTURE.md

# Production Asset Tracker

## Purpose

This document defines the architectural standards, implementation patterns, conventions, and constraints for the Production Asset Tracker application.

All future specifications and coding-agent tasks must follow this document.

When a specification conflicts with this document, this document takes precedence unless explicitly overridden.

---

# Project Vision

Production Asset Tracker is a portfolio-grade SaaS application inspired by ShotGrid and production pipeline management tools.

The project exists to demonstrate:

* Full-stack engineering
* Authentication and authorization
* Relational database design
* CRUD workflows
* Dashboard analytics
* Role-based access control
* Modern Next.js architecture
* Type-safe development practices

Primary goal:

Build a realistic production management platform recruiters can evaluate as evidence of professional software engineering capability.

---

# Technology Stack

## Frontend

* Next.js 15.x (App Router)
* React 19.x
* TypeScript
* Tailwind CSS
* Shadcn/UI
* TanStack Query
* Recharts (dashboard charts)

## Backend

* Next.js Server Actions
* Prisma ORM
* PostgreSQL

## Authentication

* Auth.js (Credentials provider with PrismaAdapter)
* @auth/prisma-adapter

## Validation

* Zod

## Deployment

* Railway

## Testing

* Vitest

## Development Tools

* ESLint
* Prettier

---

# Environment Variables

Validate all environment variables at startup using a Zod schema.

```ts
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
```

Never access `process.env` directly outside this module.

---

# Core Architecture

Application layers:

```text
UI Components
    ↓
Server Actions
    ↓
Services
    ↓
Prisma
    ↓
PostgreSQL
```

Rules:

* Components must not directly access Prisma.
* Components must not contain business logic.
* Business logic belongs in services.
* Database access belongs in services.
* Server Actions orchestrate requests.
* Services execute business logic.

---

# Directory Structure

```text
src/
│
├── app/
│
├── actions/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── projects/
│   ├── assets/
│   ├── shots/
│   ├── tasks/
│   └── users/
│
├── features/
│   ├── auth/
│   ├── projects/
│   ├── assets/
│   ├── shots/
│   ├── tasks/
│   └── dashboard/
│
├── services/
│
├── lib/
│   ├── prisma/
│   ├── auth/
│   ├── audit/         # Audit logging (auditService.log)
│   ├── permissions/
│   ├── cn.ts          # Tailwind class merging (Shadcn/UI)
│   ├── date.ts        # Date formatting (date-fns)
│   └── format.ts      # Number, status label formatting
│
├── hooks/
│
├── schemas/
│
├── types/
│
└── constants/
```

---

# Feature Organization

Each feature should remain self-contained.

Example:

```text
features/projects/
│
├── components/
├── actions/
├── services/
├── schemas/
├── types/
└── utils/
```

Feature code should stay inside the feature whenever practical.

Avoid creating giant shared folders.

### Boundary Rules

* Feature-specific code lives inside `features/<name>/`.
* Top-level `components/`, `actions/`, `services/` are for cross-cutting code only.
* Promote code to top-level only when two or more features depend on it.
* Never duplicate feature code at the top level.

---

# Data Flow

Standard pattern:

```text
Form
 ↓
Zod Validation
 ↓
Server Action
 ↓
Service
 ↓
Prisma
 ↓
Database
```

Example:

```text
CreateProjectForm
 ↓
createProjectAction
 ↓
projectService.create()
 ↓
prisma.project.create()
```

---

# Data Fetching Pattern

## Server-Side (Initial Page Load)

```text
Page (Server Component)
  ↓
Service (direct async call)
  ↓
Prisma
  ↓
Database
```

## Client-Side (Interactions)

```text
Client Component
  ↓
TanStack Query (useQuery)
  ↓
Server Action (read) or inline fetch
```

Rules:
* Fetch initial page data in Server Components via direct service calls.
* Use TanStack Query for subsequent client-side data fetching.
* Never fetch initial page data on the client.

---

# Server Actions

Use Server Actions as the primary write interface.

Examples:

```text
createProject
updateProject
deleteProject

createAsset
updateAsset

assignTask
updateTaskStatus
```

Server Actions should:

* Validate input
* Verify permissions
* Call services
* Return typed results

### Response Pattern

All Server Actions must return a consistent discriminated union:

```ts
type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

Client components handle responses via:

```ts
const result = await createProjectAction(input)
if (!result.success) {
  toast.error(result.error)
  return
}
// use result.data
```

Server Actions should not:

* Contain Prisma queries
* Contain complex business logic

---

# Route Handlers

Route Handlers should only be used when:

* External API access is required
* Webhooks are needed
* Public endpoints are necessary

Do not create route handlers for internal CRUD operations.

Use Server Actions instead.

---

# Database Design Principles

Use normalized relational design.

Avoid JSON blobs when relationships exist.

Use foreign keys.

Use Prisma relations.

Use soft deletion where appropriate.

Example:

```text
Project
 ├─ Assets
 ├─ Shots
 └─ Tasks

Task
 └─ Comments

User
 └─ Assigned Tasks
```

---

# Soft Deletion

Soft-deletable entities (Project, Asset, Shot, Task, Comment) include:

```ts
deletedAt  DateTime?
```

All read queries must always filter: `where: { deletedAt: null }`.

Create a Prisma middleware or service-layer helper to automatically apply this filter on every read query.

### Cascade Behavior

Soft-deleting a Project cascades to all related entities:

- Project → Assets (soft delete)
- Project → Shots (soft delete)
- Project → Assets → Tasks (soft delete)
- Project → Shots → Tasks (soft delete)
- Task → Comments (soft delete)

Restore is not supported in v1. Soft deletion is irreversible once confirmed by the user.

---

# Indexing Strategy

Add database indexes on:

- All foreign key columns (`projectId`, `assetId`, `shotId`, `assigneeId`, `authorId`, `roleId`)
- All status enums (`Project.status`, `Asset.status`, `Shot.status`, `Task.status`)
- Priority columns (`Task.priority`)
- `deletedAt` columns for soft-delete filtering
- `name` and `title` columns for text search
- Compound index `(projectId, status)` on Asset, Shot, and Task for dashboard aggregation queries

Prisma handles index declarations via the `@@index` attribute on models.

---

# Database Migrations

Workflow:

1. Edit `schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Review generated migration before committing
4. Commit migration alongside schema changes
5. Run `npx prisma migrate deploy` in production

---

# Prisma Conventions

Model names:

```text
User
Project
Asset
Shot
Task
Comment
Role
AuditLog
Account
Session
```

Field naming:

```text
camelCase
```

Example:

```ts
createdAt
updatedAt
projectId
assigneeId
```

---

# Date Handling

Use `date-fns` for date formatting and manipulation.

Prisma `DateTime` fields map to PostgreSQL `TIMESTAMP` (UTC).

Format dates for display using date-fns utilities on the client.

---

# Enum Strategy

Never use hardcoded strings for statuses.

Use Prisma enums.

Example:

```ts
enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  COMPLETE
}
```

```ts
enum AssetStatus {
  NOT_STARTED
  IN_PROGRESS
  REVIEW
  APPROVED
  COMPLETE
}
```

```ts
enum ProjectStatus {
  ACTIVE
  ON_HOLD
  COMPLETE
}

enum ShotStatus {
  NOT_STARTED
  IN_PROGRESS
  REVIEW
  APPROVED
  COMPLETE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AssetType {
  CHARACTER
  PROP
  ENVIRONMENT
  VEHICLE
  OTHER
}
```

---

# Validation Rules

All user input must be validated.

Validation stack:

```text
Zod
```

Requirements:

* Form validation
* Server Action validation
* Database-safe inputs

Never trust client-side validation.

---

# Authentication

Auth.js (Credentials provider with PrismaAdapter) handles:

* Login (email + password via Credentials provider)
* Logout
* Session management
* Protected routes

User model:

```ts
id
name
email
emailVerified (DateTime?)
image (String?)
passwordHash
roleId
createdAt
updatedAt
```

---

# Authorization

Authorization must be enforced server-side.

Never rely solely on UI restrictions.

Pattern:

```text
User Action
 ↓
Permission Check
 ↓
Service Execution
```

---

# RBAC

Roles:

## Admin

Permissions:

* Manage users
* Manage projects
* Manage assets
* Manage shots
* Manage tasks

## Producer

Permissions:

* Manage projects
* Manage assets
* Manage shots
* Manage tasks

Cannot:

* Manage users

## Artist

Permissions:

* View projects
* View assets
* View shots
* Update assigned tasks

Cannot:

* Create projects
* Delete records
* Manage users

---

# Permission Helpers

Centralize permissions. Every permission helper accepts the current user and returns a boolean or throws.

```ts
function requireRole(user: User, role: RoleName): void
function can(user: User, action: PermissionAction, resource: Resource): boolean
function requireOwnership(user: User, resourceOwnerId: string): void
```

Concrete helpers:

```ts
canCreateProject(user)
canDeleteProject(user)
canManageUsers(user)
canAssignTask(user, task)
canViewAllTasks(user)
canDeleteAnyRecord(user)
```

Store inside:

```text
lib/permissions/
```

---

# Security Standards

## OWASP Top 10 Compliance

### A01 — Broken Access Control

* Enforce authorization server-side on every action.
* Verify resource ownership (object-level authorization) before mutations.
* Never rely solely on UI hiding for access control.
* Use permission helpers for every protected operation.

### A02 — Cryptographic Failures

* Enforce HTTPS in production.
* Auth.js handles password hashing with bcrypt.
* Configure a strong `AUTH_SECRET` (minimum 32 bytes).
* Connect to PostgreSQL with SSL (`sslmode=require`).
* Never hardcode secrets. Use environment variables.

### A03 — Injection

* Prisma ORM parameterized queries prevent SQL injection.
* Never use `$queryRawUnsafe` or string concatenation in queries.
* Never use `dangerouslySetInnerHTML` without server-side DOMPurify sanitization.
* Zod validates all user input at the boundary.

### A04 — Insecure Design

* Rate limit authentication endpoints (max 5 attempts per 15 minutes per IP).
* Apply secure defaults for all permissions.
* Validate business rules in services, not components.
* Use a rate limiting library (Upstash Ratelimit for production, in-memory for development/testing).

### A05 — Security Misconfiguration

* Configure Content Security Policy (CSP) headers.
* Set HSTS, X-Frame-Options, X-Content-Type-Options headers.
* Configure CORS for any public endpoints.
* Keep environment variables out of version control.

### A06 — Vulnerable and Outdated Components

* Run `npm audit` regularly and in CI.
* Enable Dependabot on the repository.
* Keep dependencies up to date.

### A07 — Identification and Authentication Failures

* Configure session timeout.
* Set cookies with HttpOnly, SameSite=Lax, Secure flags.
* Never expose session tokens in URLs or logs.

### A08 — Software and Data Integrity Failures

* Commit and verify package lock files.
* Use trusted dependency sources only.

### A09 — Security Logging and Monitoring Failures

* Log authentication attempts (success and failure).
* Log authorization failures.
* Log critical database mutations.
* Never log passwords, tokens, or PII.

### Audit Log Implementation

Create an AuditLog model to persist security-relevant events:

```ts
model AuditLog {
  id         String   @id @default(cuid())
  action     String   // "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "PERMISSION_DENIED"
  entityType String   // "Project" | "Asset" | "Shot" | "Task" | "Comment" | "User"
  entityId   String?
  userId     String?
  metadata   Json?    // Request context, changed fields, etc.
  createdAt  DateTime @default(now())
}
```

Write audit entries from services after every successful mutation. Use a dedicated `auditService.log()` function. This is a non-blocking fire-and-forget operation.

### A10 — Server-Side Request Forgery

* Validate and allowlist URLs if accepting user-supplied URLs.
* Block requests to private IP ranges.

---

# UI Standards

Use:

* Shadcn/UI components
* Tailwind utilities

Design goals:

* Clean
* Professional
* SaaS-style
* Recruiter friendly

Avoid:

* Excessive animations
* Overly creative layouts
* Visual clutter

---

# Accessibility

Target WCAG 2.1 AA compliance:

* Support full keyboard navigation.
* Use semantic HTML and ARIA labels.
* Maintain sufficient color contrast.
* Test with screen readers.

---

# Tables

All management pages should use:

* Pagination
* Sorting
* Search
* Filters
* Loading states
* Empty states
* URL-persisted filter state

---

# Forms

Preferred stack:

* React Hook Form (field registration and client-side validation)
* Zod Resolver (connects Zod schemas to React Hook Form)
* `useActionState` (form submission, pending state, server validation errors)
* `useFormStatus` (submit button loading state)

### Integration Pattern

- React Hook Form owns field state, client-side validation rules, and inline errors.
- `useActionState` calls the Server Action on submit and receives the `ActionResponse`.
- Server-side validation errors from `ActionResponse.fieldErrors` map to individual form fields.
- `useFormStatus` drives the submit button's loading/disabled state.

### Requirements

* Inline validation
* Disabled submit while loading
* Error handling
* Reusable form field components with inline error display

---

# Dashboard Standards

Dashboard should emphasize business metrics.

Required metrics:

* Total Projects
* Total Assets
* Total Shots
* Open Tasks
* Overdue Tasks

Include:

* Summary cards
* Status charts
* Recent activity

### Per-Project Metrics

* Assets By Status
* Shots By Status
* Tasks By Status

---

# Query Strategy

Use TanStack Query.

Rules:

Queries:

```text
Read operations
```

Mutations:

```text
Create
Update
Delete
```

Always invalidate affected queries after mutations.

---

# Error Handling

Requirements:

* User-friendly messages
* Logging
* Graceful fallbacks

Never expose:

* Stack traces
* Database errors
* Internal implementation details

### Error Boundaries

Wrap client component sections with React Error Boundaries.

Use a fallback UI component for crashed sections.

Log error details server-side, show user-friendly message client-side.

---

# Loading States

Every async page must include:

* Loading UI
* Empty state
* Error state
* Error boundaries for client components

No blank screens.

---

# Logging

Log:

* Authentication failures
* Permission failures
* Critical database operations

Avoid logging sensitive information.

---

# Testing Strategy

Use Vitest.

Priority:

1. Permission logic
2. Services
3. Validation schemas

Minimum coverage:

* Project service
* Task service
* Permission helpers

---

# Performance Guidelines

Prefer:

* Server Components
* Streaming where appropriate
* Database pagination

Avoid:

* Large client-side datasets
* Excessive refetching
* N+1 queries

---

# Naming Conventions

Components:

```text
ProjectTable
CreateProjectDialog
TaskStatusBadge
```

Hooks:

```text
useProjects
useTasks
useDashboardMetrics
```

Actions:

```text
createProjectAction
updateProjectAction
deleteProjectAction
```

Services:

```text
projectService
assetService
taskService
```

---

# Code Quality Rules

Required:

* TypeScript strict mode
* No any types
* Reusable components
* Small focused functions
* Single responsibility
* ESLint configured
* Prettier for consistent formatting

Avoid:

* Massive files
* Duplicated logic
* Business logic in components

---

# Deployment

## Platform

* Deploy to Railway.

## Environment Variables

Required production variables:

* `DATABASE_URL` (with `sslmode=require`)
* `AUTH_SECRET`
* `AUTH_URL`

## Deployment Steps

1. Configure production PostgreSQL database.
2. Set environment variables in Railway dashboard.
3. Run Prisma migrations: `npx prisma migrate deploy`.
4. Run seed script for initial data.
5. Configure security headers (CSP, HSTS, X-Frame-Options).

## Verification

* Login works.
* CRUD operations work.
* Dashboard loads correctly.
* Database persists across sessions.
* No runtime errors.

---

# Agent Implementation Rules

When implementing a specification:

1. Read this architecture document first.
2. Implement only the requested feature.
3. Do not modify unrelated features.
4. Follow existing patterns.
5. Maintain type safety.
6. Verify acceptance criteria.
7. Report assumptions.
8. Report modified files.
9. Do not introduce new architectural patterns without justification.

All future specifications assume compliance with this document.

