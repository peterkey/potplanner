import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redis } from '@/lib/redis'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE_NAME = 'session'
const JWT_EXPIRY = '7d'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export async function signSession(userId: number): Promise<void> {
  const jti = crypto.randomUUID()
  const token = await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE, // persistent cookie — survives browser restart (AUTH-02)
  })
}

export async function verifySession(): Promise<{ userId: number; jti: string }> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) {
    throw new Error('No session cookie')
  }

  let payload: { sub?: string; jti?: string; exp?: number }
  try {
    const result = await jwtVerify(token, SECRET)
    payload = result.payload
  } catch {
    throw new Error('Invalid or expired session token')
  }

  if (!payload.sub || !payload.jti) {
    throw new Error('Malformed token payload')
  }

  const blacklisted = await redis.get(`blacklist:${payload.jti}`)
  if (blacklisted) {
    throw new Error('Token has been revoked')
  }

  return { userId: Number(payload.sub), jti: payload.jti as string }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (token) {
    try {
      const result = await jwtVerify(token, SECRET)
      const payload = result.payload
      if (payload.jti && payload.exp) {
        const ttl = Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
        await redis.setex(`blacklist:${payload.jti}`, ttl, '1')
      }
    } catch {
      // Token already invalid — still clear the cookie
    }
  }

  cookieStore.delete(COOKIE_NAME)
}
