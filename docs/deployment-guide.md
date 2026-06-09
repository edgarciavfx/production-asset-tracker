# Deployment Guide

## Overview

Production Asset Tracker is deployed on [Railway](https://railway.app) with a PostgreSQL database. The deployment is configured for zero-downtime updates with automated migrations.

**Live demo**: [https://web-production-0f345.up.railway.app](https://web-production-0f345.up.railway.app)

---

## Prerequisites

- A [Railway](https://railway.app) account
- Railway CLI: `npm i -g @railway/cli`
- Access to the project's GitHub repository

---

## Configuration

### Environment Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | Set automatically by Railway Postgres plugin |
| `AUTH_SECRET` | Auth.js signing secret (min 32 chars) | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Public URL of the deployment | Set to Railway domain or custom domain |
| `NODE_ENV` | `production` for deployment | Railway sets automatically |

### railway.json

```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npm run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 60,
    "restartPolicyType": "always"
  }
}
```

The `startCommand` runs database migrations before starting the application, ensuring the schema is up to date on every deploy.

---

## Deployment Steps

### 1. Connect Repository

In the Railway dashboard, click **New Project** → **Deploy from GitHub repo** and select the `production-asset-tracker` repository.

### 2. Provision Database

```bash
railway add postgres
```

This automatically provisions a PostgreSQL instance and sets `DATABASE_URL` in the environment.

### 3. Set Environment Variables

```bash
railway variables set AUTH_SECRET="<generated-32-char-secret>"
railway variables set AUTH_URL="https://<project-name>.up.railway.app"
```

Or set them in the Railway dashboard under **Variables**.

### 4. Deploy

```bash
railway up
```

Railway will:
1. Build the application with `npm run build`
2. Run `npx prisma migrate deploy` to apply pending migrations
3. Start the application with `npm run start`

### 5. Seed the Database (First Deploy Only)

After the first successful deploy, run the seed script:

```bash
railway run npx prisma db seed
```

This creates:
- 3 roles: **Admin**, **Producer**, **Artist**
- 1 admin user: `admin@example.com` / `admin123`

---

## CI/CD Pipeline

GitHub Actions runs automatically on every push to `main`:

| Job | Command | Purpose |
|-----|---------|---------|
| Lint | `npm run lint` | Enforces code quality rules |
| Typecheck | `npx tsc --noEmit` | Ensures TypeScript type safety |
| Test | `npx vitest run` | Runs unit tests |

All three jobs must pass before a PR can be merged.

---

## Health Check

Railway monitors the `/api/health` endpoint every 60 seconds. The endpoint returns a `200 OK` response when the application is running. If the health check fails, Railway automatically restarts the container.

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}
```

---

## Security Headers

Production responses include security headers configured in `next.config.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Restricted script/style sources | Prevents XSS |
| `Strict-Transport-Security` | `max-age=63072000` | Enforces HTTPS |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer leakage |

---

## Verification Checklist

After deployment, verify:

- [ ] Login works at `/login` with `admin@example.com` / `admin123`
- [ ] Dashboard loads with correct metrics
- [ ] CRUD operations work (create project, asset, shot, task)
- [ ] Search returns results across entities
- [ ] RBAC restrictions apply (create a non-admin user and verify limited access)
- [ ] Data persists across container restarts

---

## Troubleshooting

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| App crashes on start | Missing migration | Check that `DATABASE_URL` is correct; run `railway run npx prisma migrate deploy` |
| Login returns 500 | Missing `AUTH_SECRET` | Verify env vars are set; ensure `AUTH_SECRET` is at least 32 characters |
| Seed fails | Already seeded | Seed is idempotent on upsert; check for unique constraint violations |
| Health check failing | App not listening on correct port | Railway sets `PORT` env var; Next.js auto-detects it |
