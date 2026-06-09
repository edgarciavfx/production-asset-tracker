"use server"

import { signIn, auth } from "@/lib/auth"
import { loginSchema } from "@/features/auth/schemas/login"
import { checkRateLimit } from "@/lib/rate-limit"
import { auditService } from "@/lib/audit"
import type { ActionResponse } from "@/types"
import { headers } from "next/headers"
import { AuthError } from "next-auth"

export async function loginAction(
  _prevState: ActionResponse<undefined> | null,
  formData: FormData
): Promise<ActionResponse<undefined>> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validated.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  const ip = (await headers()).get("x-forwarded-for") ?? "unknown"
  const { allowed } = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)

  if (!allowed) {
    auditService.log("LOGIN", "User", undefined, undefined, {
      success: false,
      reason: "rate_limited",
    })
    return {
      success: false,
      error: "Too many login attempts. Please try again later.",
    }
  }

  try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirect: false,
    })
    const session = await auth()
    auditService.log("LOGIN", "User", session?.user?.id, session?.user?.id)
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof AuthError) {
      auditService.log("LOGIN", "User", undefined, undefined, {
        success: false,
        reason: "invalid_credentials",
      })
      return { success: false, error: "Invalid email or password" }
    }
    throw error
  }
}
