interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  entry.count++

  if (entry.count > maxAttempts) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: maxAttempts - entry.count }
}

export function resetRateLimit(key: string): void {
  store.delete(key)
}
