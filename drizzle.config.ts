import { defineConfig } from "drizzle-kit"
import { DB_PATH } from "./src/lib/config"

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: DB_PATH },
})
