import { describe, it, expect } from "vitest"
import { createShotSchema, updateShotSchema } from "../schemas/shot"

describe("createShotSchema", () => {
  it("accepts valid input", () => {
    const result = createShotSchema.safeParse({
      code: "SHOT_001",
      projectId: "proj-1",
    })
    expect(result.success).toBe(true)
  })

  it("accepts full input with all fields", () => {
    const result = createShotSchema.safeParse({
      code: "SHOT_001",
      description: "A test shot",
      status: "IN_PROGRESS",
      projectId: "proj-1",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty code", () => {
    const result = createShotSchema.safeParse({
      code: "",
      projectId: "proj-1",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid status", () => {
    const result = createShotSchema.safeParse({
      code: "SHOT_001",
      status: "INVALID",
      projectId: "proj-1",
    })
    expect(result.success).toBe(false)
  })

  it("applies default status of NOT_STARTED", () => {
    const result = createShotSchema.parse({
      code: "SHOT_001",
      projectId: "proj-1",
    })
    expect(result.status).toBe("NOT_STARTED")
  })

  it("rejects missing projectId", () => {
    const result = createShotSchema.safeParse({
      code: "SHOT_001",
    })
    expect(result.success).toBe(false)
  })

  it("rejects code over 50 characters", () => {
    const result = createShotSchema.safeParse({
      code: "x".repeat(51),
      projectId: "proj-1",
    })
    expect(result.success).toBe(false)
  })

  it("rejects description over 2000 characters", () => {
    const result = createShotSchema.safeParse({
      code: "SHOT_001",
      description: "x".repeat(2001),
      projectId: "proj-1",
    })
    expect(result.success).toBe(false)
  })
})

describe("updateShotSchema", () => {
  it("accepts partial input", () => {
    const result = updateShotSchema.safeParse({
      code: "SHOT_002",
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty object", () => {
    const result = updateShotSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts all fields", () => {
    const result = updateShotSchema.safeParse({
      code: "SHOT_002",
      description: "Updated description",
      status: "COMPLETE",
      projectId: "proj-2",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid status", () => {
    const result = updateShotSchema.safeParse({
      status: "INVALID",
    })
    expect(result.success).toBe(false)
  })
})
