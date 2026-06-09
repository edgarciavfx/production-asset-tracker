# Lessons Learned

## 1. Spec-Driven Development Pays Dividends

Each feature was implemented as a separate branch following a written specification. This discipline forced:

- **Clear scope**: Every branch had a defined start and end — no feature creep
- **Independent review**: PRs were smaller and focused, making code review faster
- **Rollback safety**: A broken spec never blocked others; we just fixed that branch
- **Documentation as side effect**: `SPECIFICATION.md` became a living requirements document

**What I'd do differently**: Write acceptance criteria as executable tests before writing code (spec-first testing). The spec was detailed enough for implementation but some edge cases only surfaced during testing.

---

## 2. Soft Deletion Cascades Are Deceptively Complex

The initial soft deletion implementation was straightforward — add `deletedAt` and filter queries. The complexity emerged in:

- **Cascade behavior**: Deleting a Project must soft-delete all Assets, Shots, Tasks, and Comments. Do we use a Prisma transaction or application-level loop? (Chose transaction for atomicity.)
- **Reversal**: Should restoring a Project restore its children? v1 decided no — irreversible for data safety.
- **Query complexity**: Every entity query needs `WHERE deletedAt IS NULL`. Without Prisma global filters, we had to add this to every service method manually.
- **Unique constraints**: Soft-deleted records can conflict with unique indexes. Solution: composite unique indexes including `deletedAt`.

---

## 3. Prisma Enums Have Sharp Edges

Prisma enums are powerful but come with constraints:

- **Enum values are global**: You can't have two enums sharing a value name without conflict
- **No enum deprecation**: Prisma doesn't support deprecating enum values — removing one requires a multi-step migration
- **Schema-only types**: Prisma enums generate TypeScript types, but you can't use them in Zod schemas directly — you must redefine or re-export them
- **Migration pain**: Renaming an enum value generates a full table scan migration

**What I'd do differently**: For v2, consider using string-backed enums (Zod `z.enum()` + database constraint) instead of Prisma enums, gaining flexibility at the cost of database-level enforcement.

---

## 4. Server Action Error Boundaries Need Careful Design

Server Actions execute on the server but are called from the client. Error handling requires explicit patterns:

- **Never throw**: An uncaught exception in a Server Action results in a 500 HTML page, not a structured error. Every action must catch and return `ActionResponse`.
- **Form state management**: `useActionState` pairs naturally with Server Actions but requires careful typing — the state type must match the action's return type.
- **Revalidation**: After a successful mutation, TanStack Query invalidation must be triggered manually. Server Actions don't automatically invalidate client cache.

**Pattern that worked**: Every action follows the same skeleton:
```
1. Parse input (Zod)
2. Check permissions (RBAC helper)
3. Call service method
4. Log to audit
5. Return ActionResponse
```

---

## 5. Balance Abstraction with Pragmatism

Early in development, there was pressure to abstract everything — generic CRUD services, automatic permission resolvers, dynamic form generators.

**What was learned**:

- **Too much abstraction** hides the actual business logic behind indirection. Reading `createProject` is clearer than `genericCreate('project', data)`.
- **Duplication is cheaper than the wrong abstraction** (Sandi Metz). Having similar-but-not-identical code in each feature is better than forcing a shared abstraction that doesn't fit.
- **Promote late**: Move code to shared directories only when the third feature needs it. Two similar features are coincidence; three is a pattern.

The `features/<name>/` structure naturally enforces this — code starts in the feature and is promoted only when needed.

---

## 6. TypeScript Strict Mode Is Non-Negotiable

The project uses `strict: true` in `tsconfig.json` with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

**Benefits**:
- Every nullable field must be handled — no accidental `undefined` access
- `ActionResponse` discriminated union forces exhaustive checking
- Prisma's generated types combined with strict mode catch schema mismatches at compile time
- Refactoring is safe — the compiler finds every call site

**Cost**: Initial development is slower. Every nullable field, every optional parameter, every type narrowing must be explicit. But the bugs prevented far outweigh the speed cost.
