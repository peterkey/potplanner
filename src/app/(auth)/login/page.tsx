import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 bg-accent">
      {/* Decorative radial glows */}
      <div
        className="pointer-events-none fixed -top-32 -right-32 h-[400px] w-[400px] rounded-full opacity-25"
        style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-24 -left-24 h-[320px] w-[320px] rounded-full opacity-[0.18]"
        style={{ background: 'radial-gradient(circle, var(--color-success) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #FF3B30 0%, #E0321F 100%)',
              boxShadow: '0 4px 16px rgba(255,59,48,0.30)',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
              <path d="M6.5 24V11.5A2.5 2.5 0 0 1 9 9h12a2.5 2.5 0 0 1 2.5 2.5V24" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="15" cy="11.5" r="3.75" stroke="white" strokeWidth="2.2"/>
              <path d="M10.5 17.5h9M10.5 21.5h5.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-center">
            <h1 className="t-display">PotPlanner</h1>
            <p className="t-body text-muted-foreground mt-0.5">Your money, organised.</p>
          </div>
        </div>

        {/* Card */}
        <div className="elevation-2 px-7 py-8">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
