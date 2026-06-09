# Screenshot Checklist

Take these screenshots for portfolio presentation. Each entry specifies the route, what to capture, and any preparation needed.

---

## 1. Login Page

| Field | Value |
|-------|-------|
| **Route** | `/login` |
| **Capture** | Full page — centered login card with email/password fields, "Sign In" button |
| **Annotations** | Label the Auth.js + Credentials provider; mention rate limiting (5/15min) |
| **Prep** | Log out or use incognito |

---

## 2. Dashboard

| Field | Value |
|-------|-------|
| **Route** | `/` (or `/dashboard`) |
| **Capture** | Full page — metric cards (total projects, assets, shots, active tasks, completion rate), two donut/pie charts (project status distribution, task status distribution), recent tasks table |
| **Annotations** | Call out Recharts visualization; highlight the 5 key metrics |
| **Prep** | Ensure at least a few projects and tasks exist in the database |

---

## 3. Projects List

| Field | Value |
|-------|-------|
| **Route** | `/projects` |
| **Capture** | Full page — table with columns (Name, Status, Asset/Shot/Task counts, Created), search bar, status filter, sortable headers |
| **Annotations** | Point out URL-persisted pagination/sorting/filters; soft delete cascade |
| **Prep** | 2-3 projects in different statuses (Planning, Active, Completed, On Hold) |

---

## 4. Project Create Dialog

| Field | Value |
|-------|-------|
| **Route** | `/projects` (click "New Project") |
| **Capture** | Modal overlay with form fields (Name, Description, Status dropdown) |
| **Annotations** | Label the React Hook Form + Zod resolver; show `useActionState` pattern |

---

## 5. Assets List

| Field | Value |
|-------|-------|
| **Route** | `/assets` |
| **Capture** | Full page — table with columns (Name, Type badge, Status badge, Project, Created); project filter dropdown |
| **Annotations** | Point out type badges (Character, Prop, Environment, Vehicle); status workflow |
| **Prep** | Assets in both "Active" and "On Hold" statuses across types |

---

## 6. Shot List

| Field | Value |
|-------|-------|
| **Route** | `/shots` |
| **Capture** | Full page — table with auto-generated shot codes (SHOT_001, SHOT_002), status badges, project filter |
| **Annotations** | Highlight the auto-generated `SHOT_XXX` codes; mention Prisma transaction with retry for uniqueness |

---

## 7. Task List

| Field | Value |
|-------|-------|
| **Route** | `/tasks` |
| **Capture** | Full page — table with columns (Title, Status badge, Priority badge, Assignee, Asset/Shot link); status/priority/assignee filters |
| **Annotations** | Label priority badges (Low, Medium, High, Urgent); call out assignee filter for role-based views |

---

## 8. Task Detail Page

| Field | Value |
|-------|-------|
| **Route** | `/tasks/[id]` |
| **Capture** | Full page — task details (title, description, status, priority, assignee, linked asset/shot), comment thread below |
| **Annotations** | Point out the comment system; XOR assignment (task links to one asset OR one shot, not both) |

---

## 9. Task Create Dialog

| Field | Value |
|-------|-------|
| **Route** | Any entity route (click "New Task") |
| **Capture** | Modal with all fields — title, description, status, priority, assignee, type toggle (Asset vs Shot), asset/shot selector |
| **Annotations** | Highlight the XOR assignment UI — selecting Asset hides Shot field and vice versa |

---

## 10. User Management (Admin View)

| Field | Value |
|-------|-------|
| **Route** | `/users` |
| **Capture** | Full page — table with columns (Name, Email, Role badge, Created); Create/Edit/Delete buttons visible |
| **Annotations** | This view is only accessible to Admin role; show Role badges (Admin, Producer, Artist) |

---

## 11. RBAC — Producer/Artist View Comparison

| # | Route | Role | What to capture |
|---|-------|------|-----------------|
| 11a | `/users` | Producer | No "Users" link in sidebar (hidden); 403 if navigated directly |
| 11b | `/projects` | Artist | "New Project" button hidden; delete menu absent on rows |
| 11c | `/tasks` | Artist | Only assigned tasks visible; cannot change assignee; delete hidden |

**Prep**: Create one Producer user and one Artist user. Log in as each and capture the restricted views.

---

## 12. Search Results

| Field | Value |
|-------|-------|
| **Route** | Any page (type in global search bar in top nav) |
| **Capture** | Search dropdown showing results from Projects, Assets, Shots, and Tasks |
| **Annotations** | Note that search queries all 4 entity types simultaneously; results grouped by type |

---

## Summary

| # | Screenshot | Page | Key Feature Demonstrated |
|---|------------|------|-------------------------|
| 1 | Login | `/login` | Auth.js, rate limiting |
| 2 | Dashboard | `/` | Recharts, analytics metrics |
| 3 | Projects list | `/projects` | Server-side pagination, filters, soft delete |
| 4 | Create project dialog | `/projects/+` | React Hook Form, Zod, Server Action |
| 5 | Assets list | `/assets` | Type badges, status workflow |
| 6 | Shots list | `/shots` | Auto-generated codes |
| 7 | Tasks list | `/tasks` | Priority badges, filters |
| 8 | Task detail | `/tasks/[id]` | Comments, XOR assignment |
| 9 | Create task dialog | any `/+` | XOR UI toggle |
| 10 | User management | `/users` | Admin-only, RBAC in action |
| 11 | RBAC comparisons | various | Server-side enforcement, UI hiding |
| 12 | Global search | any | Cross-entity search |
