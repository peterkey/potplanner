import 'server-only'
import fs from 'fs'
import crypto from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redis } from '@/lib/redis'
import { getUserById } from '@/lib/dal/auth'

const SECRET_PATH = '/data/jwt_secret'
let _secret: Uint8Array | null = null

function getSecret(): Uint8Array {
  if (_secret) return _secret

  if (process.env.JWT_SECRET) {
    _secret = new TextEncoder().encode(process.env.JWT_SECRET)
    return _secret
  }

  try {
    const stored = fs.readFileSync(SECRET_PATH, 'utf8').trim()
    _secret = new TextEncoder().encode(stored)
    return _secret
  } catch {
    // File doesn't exist yet — generate and persist
  }

  const generated = crypto.randomBytes(32).toString('hex')
  try {
    fs.mkdirSync('/data', { recursive: true })
    fs.writeFileSync(SECRET_PATH, generated, { mode: 0o600 })
  } catch {
    // No /data volume (local dev) — use in-memory for this process
  }
  _secret = new TextEncoder().encode(generated)
  return _secret
}
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
    .sign(getSecret())

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
    const result = await jwtVerify(token, getSecret())
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

export async function verifyAdminSession(): Promise<{ userId: number; jti: string }> {
  const session = await verifySession()
  const user = await getUserById(session.userId)
  if (!user?.isAdmin) {
    throw new Error('Admin access required')
  }
  return session
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (token) {
    try {
      const result = await jwtVerify(token, getSecret())
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
