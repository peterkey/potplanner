// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock server-only as a no-op
vi.mock('server-only', () => ({}))

// Mock @/lib/dal/auth
const mockGetUserByEmail = vi.fn()
vi.mock('@/lib/dal/auth', () => ({
  getUserByEmail: mockGetUserByEmail,
}))

// Mock @/lib/auth/session
const mockSignSession = vi.fn()
vi.mock('@/lib/auth/session', () => ({
  signSession: mockSignSession,
}))

// Mock @/lib/auth/rate-limit
const mockConsume = vi.fn()
vi.mock('@/lib/auth/rate-limit', () => ({
  loginRateLimiter: { consume: mockConsume },
}))

// Mock next/headers
const mockHeadersGet = vi.fn()
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: mockHeadersGet }),
}))

// Mock bcryptjs
const mockBcryptCompare = vi.fn()
vi.mock('bcryptjs', () => ({
  default: { compare: mockBcryptCompare },
}))

const testUser = {
  id: 1,
  email: 'test@test.com',
  passwordHash: 'hashed-password',
  createdAt: new Date(),
}

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockHeadersGet.mockReturnValue('127.0.0.1')
  mockConsume.mockResolvedValue(undefined)
})

describe('POST /api/auth/login', () => {
  it('returns 200 on valid credentials', async () => {
    mockGetUserByEmail.mockResolvedValue(testUser)
    mockBcryptCompare.mockResolvedValue(true)
    mockSignSession.mockResolvedValue(undefined)

    const { POST } = await import('../login/route')
    const response = await POST(makeRequest({ email: 'test@test.com', password: 'correct-password' }))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ success: true })
    expect(mockSignSession).toHaveBeenCalledWith(1)
  })

  it('returns 401 on wrong password', async () => {
    mockGetUserByEmail.mockResolvedValue(testUser)
    mockBcryptCompare.mockResolvedValue(false)

    const { POST } = await import('../login/route')
    const response = await POST(makeRequest({ email: 'test@test.com', password: 'wrong-password' }))

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Invalid credentials')
    expect(mockSignSession).not.toHaveBeenCalled()
  })

  it('returns 401 on non-existent email', async () => {
    mockGetUserByEmail.mockResolvedValue(undefined)

    const { POST } = await import('../login/route')
    const response = await POST(makeRequest({ email: 'nobody@test.com', password: 'any-password' }))

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Invalid credentials')
    expect(mockSignSession).not.toHaveBeenCalled()
  })

  it('returns 400 on missing fields', async () => {
    const { POST } = await import('../login/route')
    const response = await POST(makeRequest({}))

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Email and password are required')
  })

  it('returns 429 when rate limit exceeded', async () => {
    const { RateLimiterRes } = await import('rate-limiter-flexible')
    const rateLimitError = new RateLimiterRes(0, 30000, 0, undefined)
    mockConsume.mockRejectedValue(rateLimitError)

    const { POST } = await import('../login/route')
    const response = await POST(makeRequest({ email: 'test@test.com', password: 'any-password' }))

    expect(response.status).toBe(429)
    const body = await response.json()
    expect(body.error).toBe('Too many login attempts. Try again later.')
    expect(response.headers.get('Retry-After')).toBeDefined()
  })
})
