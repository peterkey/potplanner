import { vi } from 'vitest'

export const mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
}
