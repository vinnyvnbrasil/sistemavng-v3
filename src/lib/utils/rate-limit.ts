import { NextRequest } from 'next/server'

// Rate limit configuration
interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max unique tokens per interval
}

// Rate limit store
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (in production, use Redis or similar)
const store: RateLimitStore = {}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 60000) // Cleanup every minute

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async check(
    request: NextRequest,
    limit: number,
    token?: string
  ): Promise<void> {
    const identifier = token || this.getIdentifier(request)
    const key = `${identifier}:${this.config.interval}`
    const now = Date.now()

    // Get or create rate limit entry
    let entry = store[key]
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + this.config.interval
      }
      store[key] = entry
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
      const error = new Error('Rate limit exceeded')
      ;(error as any).status = 429
      ;(error as any).resetTime = entry.resetTime
      throw error
    }

    // Increment counter
    entry.count++
  }

  getStatus(request: NextRequest, token?: string): {
    limit: number
    remaining: number
    reset: number
  } {
    const identifier = token || this.getIdentifier(request)
    const key = `${identifier}:${this.config.interval}`
    const entry = store[key]
    const now = Date.now()

    if (!entry || entry.resetTime < now) {
      return {
        limit: this.config.uniqueTokenPerInterval,
        remaining: this.config.uniqueTokenPerInterval,
        reset: now + this.config.interval
      }
    }

    return {
      limit: this.config.uniqueTokenPerInterval,
      remaining: Math.max(0, this.config.uniqueTokenPerInterval - entry.count),
      reset: entry.resetTime
    }
  }

  private getIdentifier(request: NextRequest): string {
    // Try to get IP from various headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    
    let ip = '127.0.0.1'
    
    if (forwarded) {
      ip = forwarded.split(',')[0].trim()
    } else if (realIp) {
      ip = realIp
    } else if (cfConnectingIp) {
      ip = cfConnectingIp
    }

    return ip
  }

  // Clear all rate limit data
  clear(): void {
    Object.keys(store).forEach(key => {
      delete store[key]
    })
  }

  // Clear rate limit data for specific identifier
  clearIdentifier(identifier: string): void {
    Object.keys(store).forEach(key => {
      if (key.startsWith(identifier)) {
        delete store[key]
      }
    })
  }
}

// Factory function for creating rate limiters
export function rateLimit(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config)
}

// Predefined rate limiters for common use cases
export const rateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100
  }),

  // Moderate rate limiting for API endpoints
  api: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500
  }),

  // Lenient rate limiting for public endpoints
  public: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 1000
  }),

  // Very strict rate limiting for sensitive operations
  sensitive: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10
  }),

  // File upload rate limiting
  upload: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 50
  })
}

// Middleware function for Next.js API routes
export function withRateLimit(
  limiter: RateLimiter,
  limit: number,
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      await limiter.check(request, limit)
      return await handler(request)
    } catch (error: any) {
      if (error.status === 429) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Rate limit exceeded',
            error: 'TOO_MANY_REQUESTS',
            resetTime: error.resetTime
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': error.resetTime.toString(),
              'Retry-After': Math.ceil((error.resetTime - Date.now()) / 1000).toString()
            }
          }
        )
      }
      throw error
    }
  }
}

// Rate limit headers helper
export function addRateLimitHeaders(
  response: Response,
  limiter: RateLimiter,
  request: NextRequest,
  limit: number
): Response {
  const status = limiter.getStatus(request)
  
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', status.remaining.toString())
  response.headers.set('X-RateLimit-Reset', status.reset.toString())
  
  return response
}

// Rate limit decorator for class methods
export function RateLimit(limiter: RateLimiter, limit: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const request = args.find(arg => arg instanceof Request || (arg && arg.headers))
      
      if (request) {
        await limiter.check(request, limit)
      }
      
      return method.apply(this, args)
    }
  }
}

// Sliding window rate limiter (more accurate but uses more memory)
export class SlidingWindowRateLimiter {
  private windows: Map<string, number[]> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    
    // Cleanup old windows periodically
    setInterval(() => {
      this.cleanup()
    }, this.config.interval)
  }

  async check(request: NextRequest, limit: number, token?: string): Promise<void> {
    const identifier = token || this.getIdentifier(request)
    const now = Date.now()
    const windowStart = now - this.config.interval

    // Get or create window
    let window = this.windows.get(identifier) || []
    
    // Remove old entries
    window = window.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (window.length >= limit) {
      const error = new Error('Rate limit exceeded')
      ;(error as any).status = 429
      ;(error as any).resetTime = window[0] + this.config.interval
      throw error
    }

    // Add current request
    window.push(now)
    this.windows.set(identifier, window)
  }

  private getIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return realIp || '127.0.0.1'
  }

  private cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.config.interval

    for (const [identifier, window] of this.windows.entries()) {
      const filteredWindow = window.filter(timestamp => timestamp > windowStart)
      
      if (filteredWindow.length === 0) {
        this.windows.delete(identifier)
      } else {
        this.windows.set(identifier, filteredWindow)
      }
    }
  }

  clear(): void {
    this.windows.clear()
  }
}

// Token bucket rate limiter (allows bursts)
export class TokenBucketRateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map()
  private maxTokens: number
  private refillRate: number // tokens per second
  private interval: number

  constructor(maxTokens: number, refillRate: number, interval: number = 60000) {
    this.maxTokens = maxTokens
    this.refillRate = refillRate
    this.interval = interval

    // Cleanup old buckets periodically
    setInterval(() => {
      this.cleanup()
    }, interval)
  }

  async check(request: NextRequest, tokens: number = 1, identifier?: string): Promise<void> {
    const key = identifier || this.getIdentifier(request)
    const now = Date.now()

    // Get or create bucket
    let bucket = this.buckets.get(key)
    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now }
      this.buckets.set(key, bucket)
    }

    // Refill tokens
    const timePassed = (now - bucket.lastRefill) / 1000
    const tokensToAdd = Math.floor(timePassed * this.refillRate)
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now

    // Check if enough tokens available
    if (bucket.tokens < tokens) {
      const error = new Error('Rate limit exceeded')
      ;(error as any).status = 429
      ;(error as any).retryAfter = Math.ceil((tokens - bucket.tokens) / this.refillRate)
      throw error
    }

    // Consume tokens
    bucket.tokens -= tokens
  }

  private getIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return realIp || '127.0.0.1'
  }

  private cleanup(): void {
    const now = Date.now()
    const cutoff = now - this.interval

    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.lastRefill < cutoff) {
        this.buckets.delete(key)
      }
    }
  }

  clear(): void {
    this.buckets.clear()
  }
}

// Export default rate limiter
export default rateLimit