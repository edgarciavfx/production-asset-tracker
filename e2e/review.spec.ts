import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { test, expect, request as apiRequest } from "@playwright/test"

// Frame range the fixture is published with. Source frame = 1000 + proxyFrame.
const FRAME_START = 1001

let shotId = ""
let versionId = ""

async function sourceFrame(page: import("@playwright/test").Page) {
  const txt = await page.getByTestId("source-frame").textContent()
  return Number(txt?.trim())
}

test.beforeAll(async ({ baseURL }) => {
  // Generate a small test movie on disk for the server to transcode.
  const movPath = path.join(os.tmpdir(), "flipbook-e2e-src.mov")
  execFileSync(
    "ffmpeg",
    ["-y", "-f", "lavfi", "-i", "testsrc=duration=2:size=640x360:rate=24", movPath],
    { stdio: "ignore" }
  )

  const ctx = await apiRequest.newContext({ baseURL })
  const res = await ctx.post("/api/publish", {
    data: {
      project: "E2E",
      shot: "SEQ_E2E_0010",
      label: "playwright",
      sourceType: "mov",
      sourcePath: movPath,
      frameStart: FRAME_START,
      frameEnd: FRAME_START + 47,
      fps: 24,
      nukeScriptPath: "/tmp/e2e_comp.nk",
    },
  })
  expect(res.status()).toBe(201)
  const body = await res.json()
  shotId = body.shotId
  versionId = body.versionId

  // Wait for the proxy transcode to finish.
  await expect
    .poll(
      async () => (await (await ctx.get(`/api/versions/${versionId}/status`)).json()).proxyStatus,
      { timeout: 30_000, intervals: [500] }
    )
    .toBe("ready")
  await ctx.dispose()
})

test("frame stepping is frame-accurate", async ({ page }) => {
  await page.goto(`/shots/${shotId}?v=${versionId}`)
  await expect(page.getByTestId("frame-image")).toBeVisible()

  // Focus the viewer (not an input), then step with the arrow keys.
  await page.getByTestId("frame-image").click()
  const start = await sourceFrame(page)
  expect(start).toBe(FRAME_START)

  await page.keyboard.press("ArrowRight")
  await expect(page.getByTestId("source-frame")).toHaveText(String(start + 1))

  await page.keyboard.press("ArrowRight")
  await expect(page.getByTestId("source-frame")).toHaveText(String(start + 2))

  await page.keyboard.press("ArrowLeft")
  await expect(page.getByTestId("source-frame")).toHaveText(String(start + 1))
})

test("annotation + note persist across reload and jump to their frame", async ({
  page,
}) => {
  await page.goto(`/shots/${shotId}?v=${versionId}`)
  await expect(page.getByTestId("frame-image")).toBeVisible()

  // Step to a non-initial frame so the jump later is observable.
  await page.getByTestId("frame-image").click()
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight")
  const noteFrame = await sourceFrame(page)
  expect(noteFrame).toBe(FRAME_START + 5)

  // Enter annotate mode and draw a stroke on the overlay.
  await page.getByRole("button", { name: "Annotate" }).click()
  const canvas = page.getByTestId("draw-canvas")
  await expect(canvas).toBeVisible()
  const box = (await canvas.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.3)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.7, {
    steps: 8,
  })
  await page.mouse.up()

  // Add text and save.
  await page.getByPlaceholder(/Note on frame/).fill("edge chatter here")
  await page.getByRole("button", { name: "Save note" }).click()

  // The note appears in the panel anchored to noteFrame.
  const frameChip = page.getByRole("button", { name: `f${noteFrame}` })
  await expect(frameChip).toBeVisible()
  await expect(page.getByText("edge chatter here")).toBeVisible()

  // Persists across a full reload.
  await page.reload()
  await expect(page.getByTestId("frame-image")).toBeVisible()
  await expect(page.getByText("edge chatter here")).toBeVisible()
  await expect(page.getByTestId("source-frame")).toHaveText(String(FRAME_START))

  // Clicking the note jumps the playhead to its frame.
  await page.getByRole("button", { name: `f${noteFrame}` }).click()
  await expect(page.getByTestId("source-frame")).toHaveText(String(noteFrame))
})
