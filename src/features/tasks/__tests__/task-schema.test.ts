import { describe, it, expect } from "vitest"
import { createTaskSchema, updateTaskSchema } from "../schemas/task"

describe("createTaskSchema", () => {
  it("accepts valid input with assetId", () => {
    const result = createTaskSchema.safeParse({
      title: "Test task",
      projectId: "proj-1",
      assetId: "asset-1",
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid input with shotId", () => {
    const result = createTaskSchema.safeParse({
      title: "Test task",
      projectId: "proj-1",
      shotId: "shot-1",
    })
    expect(result.success).toBe(true)
  })

  it("accepts task without asset or shot", () => {
    const result = createTaskSchema.safeParse({
      title: "Test task",
      projectId: "proj-1",
    })
    expect(result.success).toBe(true)
  })

  it("accepts full input with all fields", () => {
    const result = createTaskSchema.safeParse({
      title: "Test task",
      description: "A test task",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: "2026-12-31",
      assigneeId: "user-1",
      projectId: "proj-1",
      assetId: "asset-1",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty title", () => {
    const result = createTaskSchema.safeParse({
      title: "",
      projectId: "proj-1",
      assetId: "asset-1",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid status", () => {
    const result = createTaskSchema.safeParse({
      title: "Test task",
      status: "INVALID",
      projectId: "proj-1",
      assetId: "asset-1",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid priority", () => {
    const result = createTaskSchema.safeParse({
      title: "Test task",
      priority: "INVALID",
      projectId: "proj-1",
      assetId: "asset-1",
    })
    expect(result.success).toBe(false)
  })

  it("applies default status of TODO", () => {
    const result = createTaskSchema.parse({
      title: "Test task",
      projectId: "proj-1",
      assetId: "asset-1",
    })
    expect(result.status).toBe("TODO")
  })

  it("applies default priority of MEDIUM", () => {
    const result = createTaskSchema.parse({
      title: "Test task",
      projectId: "proj-1",
      assetId: "asset-1",
    })
    expect(result.priority).toBe("MEDIUM")
  })

  it("rejects missing projectId", () => {
    const result = createTaskSchema.safeParse({
      title: "Test task",
    })
    expect(result.success).toBe(false)
  })

  it("rejects title over 200 characters", () => {
    const result = createTaskSchema.safeParse({
      title: "x".repeat(201),
      projectId: "proj-1",
      assetId: "asset-1",
    })
    expect(result.success).toBe(false)
  })

  it("rejects both assetId and shotId", () => {
    const result = createTaskSchema.safeParse({
      title: "Test task",
      projectId: "proj-1",
      assetId: "asset-1",
      shotId: "shot-1",
    })
    expect(result.success).toBe(false)
  })
})

describe("updateTaskSchema", () => {
  it("accepts partial input", () => {
    const result = updateTaskSchema.safeParse({
      title: "Updated task",
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty object", () => {
    const result = updateTaskSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts all fields", () => {
    const result = updateTaskSchema.safeParse({
      title: "Updated task",
      description: "Updated description",
      status: "COMPLETE",
      priority: "LOW",
      dueDate: "2026-12-31",
      assigneeId: "user-2",
      projectId: "proj-2",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid status", () => {
    const result = updateTaskSchema.safeParse({
      status: "INVALID",
    })
    expect(result.success).toBe(false)
  })

  it("rejects both assetId and shotId", () => {
    const result = updateTaskSchema.safeParse({
      assetId: "asset-1",
      shotId: "shot-1",
    })
    expect(result.success).toBe(false)
  })

  it("allows updating parent from asset to shot", () => {
    const result = updateTaskSchema.safeParse({
      assetId: null,
      shotId: "shot-1",
    })
    expect(result.success).toBe(true)
  })
})
