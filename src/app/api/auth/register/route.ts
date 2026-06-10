import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { getUserByEmail, getAllUsers, createUser } from '@/lib/dal/auth'
import { signSession } from '@/lib/auth/session'

const registerRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 60, // 5 registrations per IP per hour
})

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password } = body as { email?: string; password?: string }

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    )
  }

  const headerStore = await headers()
  const ip =
    headerStore.get('x-forwarded-for') ??
    headerStore.get('x-real-ip') ??
    'unknown'

  try {
    await registerRateLimiter.consume(ip)
  } catch {
    return NextResponse.json(
      { error: 'Too many registration attempts. Try again later.' },
      { status: 429 }
    )
  }

  const existing = await getUserByEmail(email)
  if (existing) {
    return NextResponse.json(
      { error: 'An account with that email already exists' },
      { status: 409 }
    )
  }

  const existingUsers = await getAllUsers()
  const isFirstUser = existingUsers.length === 0

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await createUser(email, passwordHash, isFirstUser)

  await signSession(user.id)

  return NextResponse.json({ success: true }, { status: 201 })
}
