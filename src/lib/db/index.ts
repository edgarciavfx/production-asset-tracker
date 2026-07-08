import "server-only"
import fs from "node:fs"
import path from "node:path"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { DATA_DIR, DB_PATH } from "@/lib/config"
import * as schema from "./schema"

// Ensure the data dir exists before better-sqlite3 opens the file.
fs.mkdirSync(DATA_DIR, { recursive: true })

// Reuse a single connection across Next's hot-reload module reloads in dev.
const globalForDb = globalThis as unknown as {
  __flipbookSqlite?: Database.Database
  __flipbookMigrated?: boolean
}

const sqlite =
  globalForDb.__flipbookSqlite ??
  (() => {
    const conn = new Database(DB_PATH)
    conn.pragma("journal_mode = WAL")
    conn.pragma("foreign_keys = ON")
    return conn
  })()

if (process.env.NODE_ENV !== "production") {
  globalForDb.__flipbookSqlite = sqlite
}

export const db = drizzle(sqlite, { schema })

// Apply migrations once per process on first import. Idempotent — drizzle
// records applied migrations in its own bookkeeping table, so this is a cheap
// no-op after the first boot. Keeps the tool zero-ops: no manual migrate step.
if (!globalForDb.__flipbookMigrated) {
  const migrationsFolder = path.join(process.cwd(), "drizzle")
  if (fs.existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder })
  }
  globalForDb.__flipbookMigrated = true
}

export { schema }
