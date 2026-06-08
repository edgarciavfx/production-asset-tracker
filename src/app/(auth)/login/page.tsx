import { LoginForm } from "@/features/auth/components/login-form"

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-6 px-4">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access the dashboard
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
