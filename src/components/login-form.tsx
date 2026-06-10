'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchMode(next: 'login' | 'register') {
    setMode(next)
    setError(null)
    setPassword('')
    setConfirm('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (mode === 'register' && password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
        return
      }

      const data = await res.json().catch(() => ({}))

      if (res.status === 401) {
        setError('Invalid email or password.')
      } else if (res.status === 409) {
        setError('An account with that email already exists.')
      } else if (res.status === 429) {
        setError('Too many attempts. Please try again later.')
      } else {
        setError(data?.error ?? 'Something went wrong. Please try again.')
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
    <div>
      {/* Mode tabs */}
      <div className="flex rounded-xl border border-border bg-muted p-1 mb-6">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 h-8 rounded-lg text-sm font-semibold transition-all ${
            mode === 'login'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`flex-1 h-8 rounded-lg text-sm font-semibold transition-all ${
            mode === 'register'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Create account
        </button>
      </div>

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
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {mode === 'register' && (
            <p className="t-caption text-muted-foreground">Minimum 8 characters</p>
          )}
        </div>

        {mode === 'register' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="t-label font-semibold text-foreground">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              name="confirm"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

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
              {mode === 'login' ? 'Signing in' : 'Creating account'}
            </span>
          ) : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
