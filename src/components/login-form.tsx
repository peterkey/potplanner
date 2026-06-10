'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        router.push('/')
        router.refresh()
      } else if (res.status === 401) {
        setError('Invalid email or password.')
      } else if (res.status === 429) {
        setError('Too many attempts. Please try again later.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'h-11 w-full rounded-xl border border-border bg-muted px-4 text-sm text-foreground transition-all focus:outline-none focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="t-label font-semibold text-foreground">
          Email address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="t-label font-semibold text-foreground">
          Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-primary/25 bg-accent px-4 py-2.5 t-label text-destructive"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-primary-foreground bg-primary transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in
          </span>
        ) : 'Sign in'}
      </button>
    </form>
  )
}
