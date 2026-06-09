import { describe, it, expect } from "vitest"
import { createAssetSchema, updateAssetSchema } from "../schemas/asset"

describe("createAssetSchema", () => {
  it("accepts valid input", () => {
    const result = createAssetSchema.safeParse({
      name: "Test Asset",
      projectId: "proj-1",
    })
    expect(result.success).toBe(true)
  })

  it("accepts full input with all fields", () => {
    const result = createAssetSchema.safeParse({
      name: "Test Asset",
      type: "CHARACTER",
      status: "IN_PROGRESS",
      projectId: "proj-1",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = createAssetSchema.safeParse({
      name: "",
      projectId: "proj-1",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid type", () => {
    const result = createAssetSchema.safeParse({
      name: "Test",
      type: "INVALID",
      projectId: "proj-1",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid status", () => {
    const result = createAssetSchema.safeParse({
      name: "Test",
      status: "INVALID",
      projectId: "proj-1",
    })
    expect(result.success).toBe(false)
  })

  it("applies default type of OTHER", () => {
    const result = createAssetSchema.parse({
      name: "Test",
      projectId: "proj-1",
    })
    expect(result.type).toBe("OTHER")
  })

  it("applies default status of NOT_STARTED", () => {
    const result = createAssetSchema.parse({
      name: "Test",
      projectId: "proj-1",
    })
    expect(result.status).toBe("NOT_STARTED")
  })

  it("rejects missing projectId", () => {
    const result = createAssetSchema.safeParse({
      name: "Test",
    })
    expect(result.success).toBe(false)
  })

  it("rejects name over 200 characters", () => {
    const result = createAssetSchema.safeParse({
      name: "x".repeat(201),
      projectId: "proj-1",
    })
    expect(result.success).toBe(false)
  })
})

describe("updateAssetSchema", () => {
  it("accepts partial input", () => {
    const result = updateAssetSchema.safeParse({
      name: "Updated Name",
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty object", () => {
    const result = updateAssetSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts all fields", () => {
    const result = updateAssetSchema.safeParse({
      name: "Updated",
      type: "PROP",
      status: "COMPLETE",
      projectId: "proj-2",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid type", () => {
    const result = updateAssetSchema.safeParse({
      type: "INVALID",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid status", () => {
    const result = updateAssetSchema.safeParse({
      status: "INVALID",
    })
    expect(result.success).toBe(false)
  })
})
