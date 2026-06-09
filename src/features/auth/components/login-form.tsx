"use client"

import { useActionState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
  loginSchema,
  type LoginInput,
} from "@/features/auth/schemas/login"
import { loginAction } from "@/features/auth/actions/login-action"
import type { ActionResponse } from "@/types"

export function LoginForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<
    ActionResponse<undefined> | null,
    FormData
  >(loginAction, null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  useEffect(() => {
    if (state?.success) {
      router.push("/")
    }
  }, [state, router])

  function onSubmit(data: LoginInput) {
    const formData = new FormData()
    formData.append("email", data.email)
    formData.append("password", data.password)
    formAction(formData)
  }

  const serverFieldErrors = state && !state.success ? state.fieldErrors : undefined

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="admin@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
        {serverFieldErrors?.email?.map((msg) => (
          <p key={msg} className="mt-1 text-sm text-destructive">{msg}</p>
        ))}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Enter your password"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
        {serverFieldErrors?.password?.map((msg) => (
          <p key={msg} className="mt-1 text-sm text-destructive">{msg}</p>
        ))}
      </div>
      {state && !state.success && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  )
}
