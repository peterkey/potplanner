import 'server-only'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { redis } from '@/lib/redis'

export const loginRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'login_fail',
  points: 5,
  duration: 60 * 15,
  blockDuration: 60 * 15,
})
