import fs from "node:fs"
import path from "node:path"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { DATA_DIR, DB_PATH } from "@/lib/config"

// Standalone migration runner (`npm run db:migrate`). The app also migrates
// lazily on first boot (see db/index.ts), so this is a convenience for CI or
// resetting a fresh checkout.
fs.mkdirSync(DATA_DIR, { recursive: true })
const sqlite = new Database(DB_PATH)
sqlite.pragma("journal_mode = WAL")
migrate(drizzle(sqlite), {
  migrationsFolder: path.join(process.cwd(), "drizzle"),
})
sqlite.close()
console.log(`Migrations applied to ${DB_PATH}`)
