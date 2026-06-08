import { describe, it, expect, beforeEach } from "vitest"
import { checkRateLimit, resetRateLimit } from "./rate-limit"

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimit("test-key")
  })

  it("allows requests within the limit", () => {
    const result1 = checkRateLimit("test-key", 3, 60_000)
    expect(result1.allowed).toBe(true)
    expect(result1.remaining).toBe(2)

    const result2 = checkRateLimit("test-key", 3, 60_000)
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(1)
  })

  it("blocks requests exceeding the limit", () => {
    checkRateLimit("test-key", 2, 60_000)
    checkRateLimit("test-key", 2, 60_000)
    const result = checkRateLimit("test-key", 2, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("resets after the window expires", () => {
    checkRateLimit("test-key", 1, 100)
    const result1 = checkRateLimit("test-key", 1, 100)
    expect(result1.allowed).toBe(false)

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result2 = checkRateLimit("test-key", 1, 100)
        expect(result2.allowed).toBe(true)
        resolve()
      }, 150)
    })
  })

  it("handles different keys independently", () => {
    checkRateLimit("key-a", 1, 60_000)
    expect(checkRateLimit("key-a", 1, 60_000).allowed).toBe(false)
    expect(checkRateLimit("key-b", 1, 60_000).allowed).toBe(true)
  })
})
