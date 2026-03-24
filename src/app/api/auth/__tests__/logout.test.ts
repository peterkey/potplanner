// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock server-only as a no-op
vi.mock('server-only', () => ({}))

// Mock @/lib/auth/session
const mockDestroySession = vi.fn()
vi.mock('@/lib/auth/session', () => ({
  destroySession: mockDestroySession,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/auth/logout', () => {
  it('calls destroySession and returns 200', async () => {
    mockDestroySession.mockResolvedValue(undefined)

    const { POST } = await import('../logout/route')
    const response = await POST()

    expect(mockDestroySession).toHaveBeenCalledOnce()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ success: true })
  })
})
