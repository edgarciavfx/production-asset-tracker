import { describe, it, expect } from "vitest"
import { loginSchema } from "../schemas/login"

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "password",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password",
    })
    expect(result.success).toBe(false)
  })
})
