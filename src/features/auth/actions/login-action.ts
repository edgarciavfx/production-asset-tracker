"use server"

import { signIn } from "@/lib/auth"
import { loginSchema } from "@/features/auth/schemas/login"
import { checkRateLimit } from "@/lib/rate-limit"
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
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid email or password" }
    }
    throw error
  }
}
