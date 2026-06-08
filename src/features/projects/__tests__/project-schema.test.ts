import { describe, it, expect } from "vitest"
import { createProjectSchema, updateProjectSchema } from "../schemas/project"

describe("createProjectSchema", () => {
  it("accepts valid input", () => {
    const result = createProjectSchema.safeParse({
      name: "Test Project",
      status: "ACTIVE",
    })
    expect(result.success).toBe(true)
  })

  it("accepts full input with all fields", () => {
    const result = createProjectSchema.safeParse({
      name: "Test Project",
      description: "A description",
      status: "ACTIVE",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = createProjectSchema.safeParse({
      name: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid status", () => {
    const result = createProjectSchema.safeParse({
      name: "Test",
      status: "INVALID",
    })
    expect(result.success).toBe(false)
  })

  it("applies default status of ACTIVE", () => {
    const result = createProjectSchema.parse({
      name: "Test",
    })
    expect(result.status).toBe("ACTIVE")
  })

  it("rejects name over 200 characters", () => {
    const result = createProjectSchema.safeParse({
      name: "x".repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it("rejects description over 2000 characters", () => {
    const result = createProjectSchema.safeParse({
      name: "Test",
      description: "x".repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})

describe("updateProjectSchema", () => {
  it("accepts partial input", () => {
    const result = updateProjectSchema.safeParse({
      name: "Updated Name",
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty object", () => {
    const result = updateProjectSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts all fields", () => {
    const result = updateProjectSchema.safeParse({
      name: "Updated",
      description: "New description",
      status: "ON_HOLD",
      startDate: "2026-06-01",
      endDate: null,
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid status", () => {
    const result = updateProjectSchema.safeParse({
      status: "INVALID",
    })
    expect(result.success).toBe(false)
  })
})
