import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">PotPlanner</h1>
          <p className="text-muted-foreground">Sign in to your household account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
