// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignJWT } from 'jose'

// Mock server-only as a no-op
vi.mock('server-only', () => ({}))

// Mock next/headers
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}))

// Mock @/lib/redis using the shared mock
const mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
}
vi.mock('@/lib/redis', () => ({ redis: mockRedis }))

// Test secret — must match what session.ts uses via process.env.JWT_SECRET
const TEST_SECRET = 'test-secret-for-unit-tests'
const WRONG_SECRET = 'wrong-secret-completely-different'

async function signToken(userId: number, jti: string, secret = TEST_SECRET, expiresIn = '7d') {
  const encoder = new TextEncoder()
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encoder.encode(secret))
}

async function signExpiredToken(userId: number, jti: string) {
  // Sign a token that expired 1 second ago
  const encoder = new TextEncoder()
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(jti)
    .setIssuedAt(now - 10)
    .setExpirationTime(now - 1)
    .sign(encoder.encode(jti)) // wrong secret too, but primarily expired
}

beforeEach(() => {
  vi.clearAllMocks()
  // Set the JWT_SECRET environment variable for the session module
  process.env.JWT_SECRET = TEST_SECRET
})

describe('verifySession', () => {
  it('throws "No session cookie" when cookie is not present', async () => {
    mockCookieStore.get.mockReturnValue(undefined)

    const { verifySession } = await import('../session')
    await expect(verifySession()).rejects.toThrow('No session cookie')
  })

  it('throws when JWT has wrong signature', async () => {
    const badToken = await signToken(1, 'test-jti', WRONG_SECRET)
    mockCookieStore.get.mockReturnValue({ value: badToken })

    const { verifySession } = await import('../session')
    await expect(verifySession()).rejects.toThrow('Invalid or expired session token')
  })

  it('throws "Token has been revoked" when jti is blacklisted in Redis', async () => {
    const jti = 'blacklisted-jti'
    const token = await signToken(1, jti)
    mockCookieStore.get.mockReturnValue({ value: token })
    mockRedis.get.mockResolvedValue('1')

    const { verifySession } = await import('../session')
    await expect(verifySession()).rejects.toThrow('Token has been revoked')
    expect(mockRedis.get).toHaveBeenCalledWith(`blacklist:${jti}`)
  })

  it('returns { userId, jti } for a valid non-blacklisted token', async () => {
    const jti = 'valid-jti-abc123'
    const token = await signToken(42, jti)
    mockCookieStore.get.mockReturnValue({ value: token })
    mockRedis.get.mockResolvedValue(null)

    const { verifySession } = await import('../session')
    const result = await verifySession()

    expect(result).toEqual({ userId: 42, jti })
    expect(mockRedis.get).toHaveBeenCalledWith(`blacklist:${jti}`)
  })
})

describe('signSession', () => {
  it('sets cookie with httpOnly: true and maxAge: 604800 (7 days)', async () => {
    const { signSession } = await import('../session')
    await signSession(1)

    expect(mockCookieStore.set).toHaveBeenCalledOnce()
    const [cookieName, , options] = mockCookieStore.set.mock.calls[0]
    expect(cookieName).toBe('session')
    expect(options).toMatchObject({
      httpOnly: true,
      maxAge: 604800,
      sameSite: 'lax',
      path: '/',
    })
  })
})

describe('destroySession', () => {
  it('writes jti to Redis blacklist with correct TTL', async () => {
    const jti = 'destroy-jti-xyz'
    const token = await signToken(1, jti)
    mockCookieStore.get.mockReturnValue({ value: token })
    mockRedis.setex.mockResolvedValue('OK')

    const { destroySession } = await import('../session')
    await destroySession()

    expect(mockRedis.setex).toHaveBeenCalledOnce()
    const [key, ttl, value] = mockRedis.setex.mock.calls[0]
    expect(key).toBe(`blacklist:${jti}`)
    expect(ttl).toBeGreaterThan(0)
    expect(value).toBe('1')
    expect(mockCookieStore.delete).toHaveBeenCalledWith('session')
  })

  it('deletes cookie even when token is already invalid', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'garbage.not.a.jwt' })

    const { destroySession } = await import('../session')
    await destroySession()

    expect(mockRedis.setex).not.toHaveBeenCalled()
    expect(mockCookieStore.delete).toHaveBeenCalledWith('session')
  })
})
