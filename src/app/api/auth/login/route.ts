import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { RateLimiterRes } from 'rate-limiter-flexible'
import { getUserByEmail } from '@/lib/dal/auth'
import { signSession } from '@/lib/auth/session'
import { loginRateLimiter } from '@/lib/auth/rate-limit'

export async function POST(request: Request) {
  // 1. Parse body
  const body = await request.json()
  const { email, password } = body as { email?: string; password?: string }

  // 2. Validate required fields
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  // 3. Rate limit check — BEFORE any DB work
  const headerStore = await headers()
  const ip =
    headerStore.get('x-forwarded-for') ??
    headerStore.get('x-real-ip') ??
    'unknown'

  try {
    await loginRateLimiter.consume(ip)
  } catch (rateLimiterRes) {
    if (rateLimiterRes instanceof RateLimiterRes) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimiterRes.msBeforeNext / 1000)),
          },
        }
      )
    }
    throw rateLimiterRes
  }

  // 4. Look up user
  const user = await getUserByEmail(email)

  // 5. User not found — return 401 without revealing whether email exists
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // 6. Compare password
  const valid = await bcrypt.compare(password, user.passwordHash)

  // 7. Invalid password — same error message as user-not-found
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // 8. Sign session (sets httpOnly cookie)
  await signSession(user.id)

  // 9. Return success
  return NextResponse.json({ success: true })
}
