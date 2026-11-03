/**
 * Flexible Client-Side Rate Limiter & Request Cache
 * Protects OpenWeatherMap and Groq API keys from hitting rate limits (e.g., 60 calls/min).
 */

export interface RateLimitStatus {
  used: number
  max: number
  remaining: number
  resetSeconds: number
  isThrottled: boolean
}

class ClientRateLimiter {
  private maxRequestsPerMinute: number
  private requestTimestamps: number[] = []
  private minIntervalMs: number
  private lastRequestTime = 0

  constructor(maxPerMinute = 30, minIntervalMs = 1500) {
    this.maxRequestsPerMinute = maxPerMinute
    this.minIntervalMs = minIntervalMs
  }

  // Check if a call is permitted right now
  public canMakeRequest(): boolean {
    const now = Date.now()
    this.cleanOldTimestamps(now)

    // Check interval
    if (now - this.lastRequestTime < this.minIntervalMs) {
      return false
    }

    return this.requestTimestamps.length < this.maxRequestsPerMinute
  }

  // Record an outbound request
  public recordRequest(): void {
    const now = Date.now()
    this.cleanOldTimestamps(now)
    this.requestTimestamps.push(now)
    this.lastRequestTime = now
  }

  // Clean timestamps older than 60 seconds
  private cleanOldTimestamps(now: number): void {
    const windowStart = now - 60000
    this.requestTimestamps = this.requestTimestamps.filter((t) => t > windowStart)
  }

  // Current status for UI readout
  public getStatus(): RateLimitStatus {
    const now = Date.now()
    this.cleanOldTimestamps(now)
    const used = this.requestTimestamps.length
    const remaining = Math.max(0, this.maxRequestsPerMinute - used)

    // Calculate time until oldest timestamp in window expires
    let resetSeconds = 60
    if (this.requestTimestamps.length > 0) {
      const oldest = this.requestTimestamps[0]
      resetSeconds = Math.max(1, Math.round((oldest + 60000 - now) / 1000))
    }

    return {
      used,
      max: this.maxRequestsPerMinute,
      remaining,
      resetSeconds,
      isThrottled: !this.canMakeRequest(),
    }
  }

  // Update limit dynamically
  public setLimit(maxPerMinute: number): void {
    this.maxRequestsPerMinute = Math.max(5, Math.min(120, maxPerMinute))
  }
}

export const weatherRateLimiter = new ClientRateLimiter(30, 2000)

