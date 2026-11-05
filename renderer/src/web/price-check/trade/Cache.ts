import type { RateLimiter } from './RateLimiter'
import hash from 'object-hash'

const CACHE_TTL = 300

export class Cache {
  private cached = new Map<string, unknown>()
  private timers = new Map<string, ReturnType<typeof setTimeout>>()

  get<T = unknown> (key: unknown): T | undefined {
    const _key = hash.sha1(JSON.parse(JSON.stringify(key)))
    return this.cached.get(_key) as T | undefined
  }

  set<T = unknown> (key: unknown, value: T, ttl: number): void {
    const _key = hash.sha1(JSON.parse(JSON.stringify(key)))
    this.cached.set(_key, value)

    clearTimeout(this.timers.get(_key))
    this.timers.set(_key, setTimeout(() => {
      this.cached.delete(_key)
      this.timers.delete(_key)
    }, ttl * 1000))
  }

  clear (): void {
    for (const timer of this.timers.values()) clearTimeout(timer)
    this.timers.clear()
    this.cached.clear()
  }

  static deriveTtl (...limits: RateLimiter[]): number {
    return (limits.length) ? CACHE_TTL : 0
  }
}
