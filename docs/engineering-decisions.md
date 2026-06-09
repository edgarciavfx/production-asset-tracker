# Engineering Decisions

## 1. Server Actions over API Routes

**Decision**: Use Next.js Server Actions instead of traditional REST API routes for all mutations.

**Context**: Next.js 15 introduced stable Server Actions. The traditional pattern would be API routes (`/api/projects`) called via `fetch()` from the client.

**Rationale**:
- Server Actions require no manual HTTP client code — they're called directly from components
- They participate in the React lifecycle (progressive enhancement, pending states via `useActionState`)
- No need to define request/response serialization — just call a function
- TypeScript types flow seamlessly from service to action to component

**Trade-off**: Server Actions are tightly coupled to Next.js. Migrating to another framework would require rewriting all mutation logic.

**Verdict**: Correct for this project. The tight coupling is acceptable for a Next.js application.

---

## 2. `ActionResponse<T>` Discriminated Union

**Decision**: Every Server Action returns `ActionResponse<T>` — a typed discriminated union of success or failure.

```typescript
type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

**Rationale**:
- Never throw exceptions across the server-client boundary
- Components handle errors with a simple `if (!result.success)` check
- Field-level errors map directly to form fields (React Hook Form integration)
- Consistent pattern across all 10+ actions — no surprises

---

## 3. Feature-Scoped Code Organization

**Decision**: Organize code by feature (`features/<name>/`) rather than by type (`components/`, `services/`, etc.).

**Rationale**:
- Related code lives in one directory — easy to find, easy to delete, easy to extract
- Clear boundaries prevent accidental coupling
- New contributors can understand a feature by reading one directory
- Promotes to shared (`lib/`, `components/ui/`) only when 2+ features depend on it

---

## 4. Prisma Enums for Domain Statuses

**Decision**: Define statuses (ProjectStatus, AssetStatus, ShotStatus, TaskStatus) as Prisma enums rather than application-level strings or TypeScript enums.

**Rationale**:
- Database-level enforcement — impossible to insert invalid status values
- Prisma generates TypeScript types automatically — no manual enum definitions
- Migration-safe — renaming requires a migration, which is a feature for production safety
- Enum values appear in the database schema as documentation

**Lesson learned**: Prisma enums have limitations — they can't be used in the same file as `@default()` in all cases, and renaming values requires multi-step migrations.

---

## 5. Soft Deletion with Cascade

**Decision**: Implement soft deletion via `deletedAt` nullable timestamp on all entity tables, with cascading confirmation.

**Rationale**:
- Data recovery: deleted records are hidden but not destroyed
- Audit trail: `deletedAt` preserves the deletion timestamp
- Consistency: all entities follow the same pattern with `whereDeleted` Prisma helper

**Cascade rules**:
- Deleting a Project soft-deletes all its Assets, Shots, and Tasks
- Deleting an Asset or Shot soft-deletes all its Tasks
- Deleting a Task soft-deletes all its Comments

**Trade-off**: Soft deletion adds a `WHERE deletedAt IS NULL` clause to every query. A Prisma middleware or global filter would be cleaner but Prisma doesn't support global query filters.

---

## 6. Auth.js Credentials Provider with JWT

**Decision**: Use Auth.js Credentials provider with JWT strategy instead of database sessions or OAuth providers.

**Rationale**:
- Credentials provider is simplest to set up — no external dependency (Google, GitHub)
- JWT strategy avoids a database lookup on every request (vs database sessions)
- 7-day session expiry with forced re-authentication
- Role embedded in JWT — no extra query to determine permissions

**Trade-off**: JWT revocation isn't possible — a stolen token is valid until expiry. Acceptable for this scale.

---

## 7. Rate Limiting without Redis

**Decision**: Implement login rate limiting with an in-memory Map instead of Redis or an external cache.

```typescript
const attempts = new Map<string, { count: number; resetAt: number }>();
```

**Rationale**:
- Zero infrastructure dependencies — works on any deployment
- Sufficient for single-server deployment on Railway
- 5 attempts per 15-minute window per IP
- Stateless rate limiting (Redis) would be required for horizontal scaling, but that's future work

**Trade-off**: Rate limit state is lost on server restart. Acceptable for a demo/portfolio application. A Redis-backed solution is documented as the next step for production scaling.

---

## 8. XOR Task Assignment via Zod Discriminated Union

**Decision**: Enforce mutually exclusive assignment (Task belongs to exactly one Asset OR one Shot) using Zod's discriminated union at the schema level.

```typescript
const taskSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("asset"), assetId: z.string().uuid() }),
  z.object({ type: z.literal("shot"), shotId: z.string().uuid() }),
]);
```

**Rationale**:
- Impossible to create a Task linked to both or neither
- Validation happens at the input boundary — service logic doesn't need to check
- TypeScript type narrows automatically after validation
- Server Action and UI both use the same schema

---

## 9. `cn()` for Tailwind Class Merging

**Decision**: Use `clsx` + `tailwind-merge` via a `cn()` utility for all conditional class names.

**Rationale**:
- `clsx` handles conditional class merging (`cn("base", isActive && "active")`)
- `tailwind-merge` intelligently resolves conflicting Tailwind classes
- Consistent, readable pattern across all components
- Avoids manual string concatenation

---

## 10. `date-fns` for Date Formatting

**Decision**: Use `date-fns` instead of Moment.js or Day.js for all date formatting.

**Rationale**:
- Tree-shakeable — import only the functions you need
- Immutable by default
- TypeScript-first with full type definitions
- Lighter than Moment.js, more feature-rich than native Intl for relative time
