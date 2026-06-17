/**
 * rateLimiterService — Token bucket rate limiter
 * ==============================================
 * Implementa: getStats, getRateStats
 */

class RateLimiterService {
  constructor() {
    this.name = 'rateLimiterService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.buckets = new Map();  // ip → {tokens, lastRefill}
    this.requests = 0;
    this.blocked = 0;
    this.maxPerMin = 60;
  }

  check(ip) {
    this.requests++;
    const now = Date.now();
    let bucket = this.buckets.get(ip);
    if (!bucket) {
      bucket = { tokens: this.maxPerMin, lastRefill: now };
      this.buckets.set(ip, bucket);
    }
    // Refill 1 token per second
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.maxPerMin, bucket.tokens + elapsed);
    bucket.lastRefill = now;
    if (bucket.tokens < 1) {
      this.blocked++;
      return { allowed: false, remaining: 0, retryAfter: 1 };
    }
    bucket.tokens -= 1;
    return { allowed: true, remaining: Math.floor(bucket.tokens) };
  }

  getStats() {
    return this.getRateStats();
  }

  getRateStats() {
    return {
      totalRequests: this.requests,
      totalBlocked: this.blocked,
      totalAllowed: this.requests - this.blocked,
      activeBuckets: this.buckets.size,
      maxPerMin: this.maxPerMin,
      uptime: process.uptime(),
    };
  }

  getStatus() { return { ready: this.ready, ...this.getRateStats() }; }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
}

const instance = new RateLimiterService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, rateLimiter: instance,
});
export const rateLimiter = instance;
export { instance, wrapped };
export default wrapped;
