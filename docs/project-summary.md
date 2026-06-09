# Production Asset Tracker — Project Summary

## Problem

Production teams in animation, VFX, and game development lack accessible tooling for tracking assets, shots, and tasks across projects. The dominant solution (ShotGrid) is enterprise-grade but expensive and complex. Most smaller studios fall back to spreadsheets, email, and sticky notes — leading to missed deadlines, duplicated work, and communication breakdowns.

## Solution

A full-stack SaaS application that replaces ad-hoc production tracking with a structured, role-aware pipeline management system. Inspired by ShotGrid but built with modern web architecture — designed to be self-hostable, extensible, and a demonstration of professional engineering practice.

## Technical Challenges

| Challenge | Approach |
|-----------|----------|
| Server Action error handling | `ActionResponse<T>` discriminated union pattern ensures every action returns a typed `{success, data}` or `{success, error}` — never throws |
| Rate limiting | In-memory sliding window (5 attempts per 15 minutes) on login without adding infrastructure dependencies |
| XOR task assignment | Zod discriminated union validates that a task links to exactly one asset OR one shot, enforced at schema + action levels |
| Auto-generated shot codes | Prisma transaction with retry generates unique `SHOT_XXX` codes per project on creation |
| Cascading soft delete | Soft deletion cascades through Project → Assets/Shots → Tasks → Comments with irreversible confirmation modal |
| Search across 4 entities | Global search action queries Projects, Assets, Shots, and Tasks via combined `LIKE` queries with URL-persisted state |

## Architecture Decisions

- **Next.js 15 App Router** with React Server Components for initial page load and TanStack Query for client-side mutations
- **Server Actions instead of API routes** — colocate mutation logic with the UI layer while keeping business logic in services
- **4-layer architecture**: UI Components → Server Actions (validation + auth) → Services (business logic) → Prisma (data access)
- **Feature-scoped code**: Each feature (auth, projects, assets, shots, tasks, dashboard, search, users) is self-contained in `features/<name>/` with `actions/`, `components/`, `schemas/`, `services/`
- **Auth.js Credentials provider** with JWT strategy — simpler than database sessions for a single-server deployment, adequate security with rate limiting
- **Prisma enums** for all domain statuses — database-level enforcement rather than application-level strings

## Security Considerations

- **RBAC**: 3 roles (Admin, Producer, Artist) with 14 granular permission helpers enforced server-side on every action
- **OWASP Top 10**: SQL injection (Prisma parameterization), XSS (React escaping + CSP), CSRF (SameSite cookies + Next.js built-in), broken access control (server-side enforcement), rate limiting on auth
- **Audit logging**: All auth attempts and mutations persisted to `AuditLog` table
- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy configured in `next.config.ts`

## Deployment Strategy

- **Platform**: Railway with PostgreSQL
- **CI**: GitHub Actions (lint, typecheck, test on every push)
- **Migrations**: `prisma migrate deploy` runs at container start
- **Health checks**: `/api/health` endpoint with 60s timeout
- **Zero-downtime**: Railway handles routing; migrations are backward-compatible

## Key Metrics

- ~73 source files across 8 features
- Full test suite (Vitest) covering validation schemas, services, and permission helpers
- 9 database models with 6 Prisma enums and comprehensive indexes
- 14 permission helpers enforcing 3-role RBAC

---

## Résumé / Portfolio Blurb

> **Production Asset Tracker** — Full-stack SaaS for production pipeline management, inspired by ShotGrid. Built with Next.js 15, React 19, TypeScript, Prisma, PostgreSQL, and Auth.js. Features layered architecture (Server Actions → Services → Prisma), 3-role RBAC with 14 server-side permission helpers, auto-generated shot codes, cascading soft deletion, global search across 4 entity types, dashboard analytics with Recharts, audit logging, rate-limited authentication, and OWASP Top 10 security compliance. Deployed on Railway with CI/CD via GitHub Actions. Demonstrates clean architecture, type-safe data access, and professional-grade security practices.
