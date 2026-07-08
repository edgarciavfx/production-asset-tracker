import { ZodError } from "zod"

/**
 * Discriminated result type returned by every server action. Callers switch on
 * `ok` — no throwing across the server/client boundary.
 */
export type ActionResponse<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

export function ok<T>(data: T): ActionResponse<T> {
  return { ok: true, data }
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string[]>
): ActionResponse<never> {
  return { ok: false, error, fieldErrors }
}

/** Wrap a server action body: normalizes Zod + thrown errors into fail(). */
export async function action<T>(
  fn: () => Promise<T> | T
): Promise<ActionResponse<T>> {
  try {
    return ok(await fn())
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of err.issues) {
        const key = issue.path.join(".") || "_"
        ;(fieldErrors[key] ??= []).push(issue.message)
      }
      return fail("Validation failed", fieldErrors)
    }
    const message = err instanceof Error ? err.message : "Something went wrong"
    return fail(message)
  }
}
