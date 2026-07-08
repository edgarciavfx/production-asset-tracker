import os from "node:os"
import path from "node:path"
import { defineConfig, devices } from "@playwright/test"

// Run the e2e suite against a real dev server bound to a throwaway data dir so
// it never touches your working data/flipbook.db.
const PORT = 3210
const DATA_DIR = path.join(os.tmpdir(), "flipbook-e2e")

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Run against a production build: Next's Turbopack dev server's HMR runtime
  // doesn't hydrate reliably under headless automation, so we build + start.
  webServer: {
    command: "npm run build && npm run start",
    port: PORT,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      PORT: String(PORT),
      FLIPBOOK_DATA_DIR: DATA_DIR,
    },
  },
})
