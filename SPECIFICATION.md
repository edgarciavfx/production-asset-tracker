# Production Asset Tracker — Specification

> **Companion Document:** See [ARCHITECTURE.md](./ARCHITECTURE.md) for architectural standards, conventions, and constraints.
>
> This specification assumes compliance with ARCHITECTURE.md unless explicitly overridden.

---

## 1. Foundation

### Goal

Create the initial application architecture and development environment.

### Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/UI
- TanStack Query
- Auth.js
- Zod
- Vitest
- PostgreSQL
- Prisma ORM
- Railway

### Development Tools

- ESLint
- Prettier

### Requirements

#### Project Setup

- Initialize Next.js project
- Configure TypeScript
- Configure Tailwind CSS
- Configure ESLint
- Configure Prettier

#### Database

- Install Prisma
- Create Prisma configuration
- Configure PostgreSQL connection with SSL (`sslmode=require`)
- Create initial migration setup

#### Layout

Create application shell with:

- Sidebar navigation
- Top navigation bar
- Main content area

#### Pages

Create placeholder pages:

- Dashboard
- Projects
- Assets
- Shots
- Tasks
- Users

#### UI

Responsive layout:

- Desktop sidebar
- Mobile navigation menu

### Acceptance Criteria

- Project runs locally
- No TypeScript errors
- Prisma connects successfully
- Layout renders correctly
- Responsive navigation works

---

## 2. Authentication

> **Note:** This spec requires the User and Role models from Spec 3 (Database). Implement Spec 3 first, or create the Prisma schema for User and Role within this spec before configuring Auth.js.

### Goal

Implement authentication and protected routes.

### Requirements

#### Authentication Provider

Use Auth.js with the Credentials provider and PrismaAdapter.

#### Features

- Login page (email + password form)
- Logout functionality
- Session management
- Protected routes
- User persistence
- **Admin-only user creation** — no self-registration. The seed script creates the first admin user.

#### User Fields

- id
- name
- email
- emailVerified (nullable)
- image (nullable)
- passwordHash
- roleId
- createdAt
- updatedAt

#### Security

- Rate limit authentication endpoints (max 5 attempts per 15 minutes per IP)
- Configure session timeout (7 days of inactivity)
- Set cookies with HttpOnly, SameSite=Lax, Secure flags
- Never expose session tokens in URLs or logs

#### Pages

/public/login

#### Middleware

Protect:

- /
- /projects
- /assets
- /shots
- /tasks
- /users

#### User Stories

As a user,
I can log in.

As a user,
I stay logged in after refresh.

As a guest,
I cannot access protected routes.

### Acceptance Criteria

- Login works
- Logout works
- Session persists
- Unauthorized users are redirected

---

## 3. Database Schema

### Goal

Design production tracking database.

### Security Rules

- Never use `$queryRawUnsafe` or string concatenation in queries
- Connect with SSL in production (`sslmode=require`)
- All input validated via Zod before reaching Prisma

> **Implementation note:** Every model with a `deletedAt` field uses soft deletion. All Prisma read queries must filter `where: { deletedAt: null }`. See ARCHITECTURE.md §Soft Deletion for cascade behavior.

### Field Types and Constraints

#### User

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| name | String | |
| email | String | @unique |
| emailVerified | DateTime? | nullable |
| image | String? | nullable |
| passwordHash | String | |
| roleId | String | |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| deletedAt | DateTime? | nullable, for soft deletion |

#### Role

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| name | String | @unique |

Roles:

- Admin
- Producer
- Artist

#### Project

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| name | String | |
| description | String? | nullable |
| status | ProjectStatus | enum |
| startDate | DateTime? | nullable |
| endDate | DateTime? | nullable |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| deletedAt | DateTime? | nullable, for soft deletion |

Status enum: `ACTIVE`, `ON_HOLD`, `COMPLETE`

#### Asset

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| name | String | |
| type | AssetType | enum |
| status | AssetStatus | enum |
| projectId | String | |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| deletedAt | DateTime? | nullable, for soft deletion |

AssetType enum: `CHARACTER`, `PROP`, `ENVIRONMENT`, `VEHICLE`, `OTHER`

AssetStatus enum: `NOT_STARTED`, `IN_PROGRESS`, `REVIEW`, `APPROVED`, `COMPLETE`

#### Shot

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| code | String | auto-generated `SHOT_XXX` per project, or user-defined |
| description | String? | nullable |
| status | ShotStatus | enum |
| projectId | String | |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| deletedAt | DateTime? | nullable, for soft deletion |

ShotStatus enum: `NOT_STARTED`, `IN_PROGRESS`, `REVIEW`, `APPROVED`, `COMPLETE`

#### Task

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| title | String | |
| description | String? | nullable |
| status | TaskStatus | enum |
| priority | TaskPriority | enum |
| assigneeId | String? | nullable |
| assetId | String? | nullable (XOR with shotId) |
| shotId | String? | nullable (XOR with assetId) |
| dueDate | DateTime? | nullable |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| deletedAt | DateTime? | nullable, for soft deletion |

TaskStatus enum: `TODO`, `IN_PROGRESS`, `REVIEW`, `COMPLETE`
TaskPriority enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

**Validation:** Exactly one of `assetId` or `shotId` must be set (XOR). Both null or both set is invalid.

#### Comment

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| body | String | |
| taskId | String | |
| authorId | String | |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| deletedAt | DateTime? | nullable, for soft deletion |

> Comment CRUD is implemented as part of Spec 7 (Task Management). See §7.

#### Auth.js Adapter Models

Required by `@auth/prisma-adapter`:

```ts
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Relationships

- Role -> Users (one-to-many)
- Project -> Assets (one-to-many)
- Project -> Shots (one-to-many)
- Asset -> Tasks (one-to-many)
- Shot -> Tasks (one-to-many)
- Task -> Comments (one-to-many)
- User -> Tasks (one-to-many, via assigneeId)
- User -> Comments (one-to-many, via authorId)
- User -> Account (one-to-many)
- User -> Session (one-to-many)

### Acceptance Criteria

- Prisma schema validates
- Migration succeeds
- Seed script succeeds

---

## 4. Project Management

### Goal

Implement project CRUD.

### Security

- Verify object-level authorization before mutations
- Enforce permission checks server-side on every action

### Requirements

#### Create Project

Fields:

- Name
- Description
- Status
- Start Date
- End Date

#### Read

Project list page.

Display:

- Name
- Status
- Asset Count (placeholder until Spec 5 provides real data)
- Shot Count (placeholder until Spec 6 provides real data)

Table features:

- Pagination
- Sorting
- Search
- Filters
- Loading states
- Empty states
- URL-persisted filter state

#### Update

Edit project information.

#### Delete

Soft delete project (sets `deletedAt`, cascades to related assets, shots, tasks, and comments). See ARCHITECTURE.md §Soft Deletion.

#### Search

Search by project name.

#### Filters

Filter by:

- Active
- On Hold
- Complete

### Acceptance Criteria

- CRUD works
- Search works
- Filters work
- Validation works

---

## 5. Asset Management

### Goal

Track production assets.

### Security

- Verify object-level authorization before mutations

### Requirements

#### Create Asset

Fields:

- Name
- Type
- Status
- Project

#### Status

- Not Started
- In Progress
- Review
- Approved
- Complete

#### Asset Types

- Character
- Prop
- Environment
- Vehicle
- Other

#### Features

- Asset list (with pagination, sorting, search, filters)
- Asset details
- Edit asset
- Delete asset
- Search assets

#### Relationships

- Asset belongs to Project.
- Asset can contain Tasks.

### Acceptance Criteria

- Asset CRUD works
- Assets linked to projects
- Search works

---

## 6. Shot Management

### Goal

Track production shots.

### Security

- Verify object-level authorization before mutations

### Requirements

#### Create Shot

Fields:

- Code (auto-generated as `SHOT_XXX` where `XXX` is a sequential integer; may be overridden by user)
- Description
- Status
- Project

#### Status

- Not Started
- In Progress
- Review
- Approved
- Complete

#### Features

- Shot list (with pagination, sorting, search, filters)
- Shot details
- Edit shot
- Delete shot

#### Relationships

- Shot belongs to Project.
- Shot can contain Tasks.

### Acceptance Criteria

- Shot CRUD works
- Shots linked to projects

---

## 7. Task Management

### Goal

Manage production work assignments.

### Security

- Verify object-level authorization before mutations
- Artists can only update tasks assigned to them

### Requirements

#### Create Task

Fields:

- Title
- Description
- Status
- Priority
- Due Date
- Assignee

#### Status

- Todo
- In Progress
- Review
- Complete

#### Priority

- Low
- Medium
- High
- Critical

#### Assignment

Assign task to exactly one parent:

- Asset (assetId set, shotId null)
- Shot (shotId set, assetId null)

**Validation:** Exactly one of `assetId` or `shotId` must be set (XOR). Both null or both set is invalid.

#### Features

- Create task
- Edit task
- Delete task
- Reassign task
- View task history (status changes tracked via AuditLog — see ARCHITECTURE.md §Audit Log Implementation)
- Task list (with pagination, sorting, search, filters)

#### Comments

Each task supports comment threads:

- **Create comment:** `body` text, linked to `taskId` and `authorId` (current user)
- **Read comments:** List comments on task detail page, ordered by `createdAt` ascending
- **Delete comment:** Author or Admin can delete (soft delete)

### Acceptance Criteria

- Tasks can be assigned
- Status updates work
- Priority updates work
- Comments can be added to tasks
- Comments appear on task detail page

---

## 8. Dashboard

### Goal

Provide production overview.

### Security

- Dashboard data respects RBAC (artists see only their data)

### Metrics

#### Global

| Metric | Definition |
|--------|------------|
| Total Projects | Count where `deletedAt IS NULL` |
| Total Assets | Count where `deletedAt IS NULL` |
| Total Shots | Count where `deletedAt IS NULL` |
| Open Tasks | Count where `deletedAt IS NULL` AND `status IN (TODO, IN_PROGRESS, REVIEW)` |
| Overdue Tasks | Count where `deletedAt IS NULL` AND `status != COMPLETE` AND `dueDate < now` |

#### Per-Project

- Assets By Status
- Shots By Status
- Tasks By Status

#### User Metrics

- Assigned Tasks
- Overdue Tasks

### UI

#### Cards

| Card | Definition |
|------|------------|
| Total Projects | Count where `deletedAt IS NULL` |
| Open Tasks | Count where `deletedAt IS NULL` AND `status IN (TODO, IN_PROGRESS, REVIEW)` |
| Active Assets | Count where `deletedAt IS NULL` AND `status != COMPLETE` |
| Active Shots | Count where `deletedAt IS NULL` AND `status != COMPLETE` |

#### Charts

- Task Status Distribution
- Project Status Distribution

#### Tables

Recent Tasks

Columns:

- Task
- Assignee
- Due Date
- Status

### Acceptance Criteria

- Metrics display correctly
- Dashboard loads quickly

---

## 9. Search & Filtering

### Goal

Provide fast navigation across records.

### Requirements

#### Global Search

Search:

- Projects
- Assets
- Shots
- Tasks

#### Filters

Projects

- Status

Assets

- Type
- Status

Shots

- Status

Tasks

- Status
- Priority
- Assignee

### Acceptance Criteria

- Results are accurate
- Filters can be combined
- URL stores filter state

---

## 10. Role Based Access Control

### Goal

Restrict actions by role.

### Security

- Enforce authorization on every server action, not just UI
- Verify object-level authorization (resource ownership) in addition to role checks

### Roles

#### Admin

Can:

- Manage users (create, edit, deactivate, delete users)
- Manage projects
- Manage assets
- Manage shots
- Manage tasks
- View all records across all entities
- Delete any record

#### Producer

Can:

- Manage projects
- Manage assets
- Manage shots
- Manage tasks
- View all records across all entities

Cannot:

- Manage users
- Delete records

#### Artist

Can:

- View projects
- View assets
- View shots
- View tasks (all tasks, not only assigned — read-only)
- Update assigned tasks (status and priority only; cannot reassign)

Cannot:

- Create projects
- Create assets
- Create shots
- Delete any record
- Manage users
- Assign or reassign tasks

### Role Management

Roles are seeded data (Admin, Producer, Artist). No runtime role creation or editing in v1. Users are assigned a role at creation time via the admin panel.

### Acceptance Criteria

- Permissions enforced
- Unauthorized actions blocked
- UI hides unavailable actions

---

## 11. Deployment

### Goal

Deploy application to Railway.

### Security

- Enforce HTTPS in production
- Configure security headers (CSP, HSTS, X-Frame-Options)
- Never commit environment variables to version control

### Requirements

#### Environment Variables

- DATABASE_URL (with sslmode=require)
- AUTH_SECRET (minimum 32 bytes)
- AUTH_URL

#### Production Setup

- Production PostgreSQL
- Prisma migrations (migrate deploy)
- Seed script

#### Verification

- Login works
- CRUD works
- Dashboard loads
- Database persists
- No runtime errors

### Deliverables

- Railway configuration
- Deployment instructions
- Production README

### Acceptance Criteria

- Successful deployment
- No runtime errors
