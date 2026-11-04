// Counters injected into the overlay page before its own scripts run (see
// perf.spec.ts). They count what wakes the overlay up while you play: timer
// callbacks, animation frames and messages to and from the app. Counts are
// the same on every machine, unlike CPU time, so CI can hold them to a budget.
import type { Page } from '@playwright/test'

export interface ProbeCounts {
  timeouts: number
  intervals: number
  frames: number
  idleCallbacks: number
  // Interval callbacks by their delay (ms), to find who ticks.
  intervalsByDelay: Record<string, number>
  sent: Record<string, number>
  received: Record<string, number>
}

declare global {
  interface Window { __perfProbe: { counts: ProbeCounts, reset: () => void } }
}

export async function installProbe (page: Page) {
  await page.addInitScript(() => {
    const fresh = (): ProbeCounts => ({ timeouts: 0, intervals: 0, frames: 0, idleCallbacks: 0, intervalsByDelay: {}, sent: {}, received: {} })
    const probe = { counts: fresh(), reset () { probe.counts = fresh() } }
    window.__perfProbe = probe

    const origTimeout = window.setTimeout
    const origInterval = window.setInterval
    const origRaf = window.requestAnimationFrame
    const origIdle = window.requestIdleCallback
    window.setTimeout = function (fn: TimerHandler, ms?: number, ...args: unknown[]) {
      if (typeof fn !== 'function') return origTimeout(fn, ms, ...args)
      return origTimeout(function (this: unknown, ...a: unknown[]) { probe.counts.timeouts++; return fn.apply(this, a) }, ms, ...args)
    } as typeof window.setTimeout
    window.setInterval = function (fn: TimerHandler, ms?: number, ...args: unknown[]) {
      if (typeof fn !== 'function') return origInterval(fn, ms, ...args)
      const key = String(ms ?? 0)
      return origInterval(function (this: unknown, ...a: unknown[]) {
        probe.counts.intervals++
        probe.counts.intervalsByDelay[key] = (probe.counts.intervalsByDelay[key] ?? 0) + 1
        return fn.apply(this, a)
      }, ms, ...args)
    } as typeof window.setInterval
    window.requestAnimationFrame = function (fn: FrameRequestCallback) {
      return origRaf((t) => { probe.counts.frames++; fn(t) })
    }
    if (origIdle) {
      window.requestIdleCallback = function (fn: IdleRequestCallback, opts?: IdleRequestOptions) {
        return origIdle((d) => { probe.counts.idleCallbacks++; fn(d) }, opts)
      }
    }

    const nameOf = (data: unknown) => {
      if (typeof data !== 'string') return '(binary)'
      try { return String(JSON.parse(data).name ?? '?') } catch { return '?' }
    }
    const Orig = window.WebSocket
    class CountingWebSocket extends Orig {
      constructor (url: string | URL, protocols?: string | string[]) {
        super(url, protocols)
        this.addEventListener('message', (e) => {
          const n = nameOf(e.data)
          probe.counts.received[n] = (probe.counts.received[n] ?? 0) + 1
        })
      }

      send (data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        const n = nameOf(data)
        probe.counts.sent[n] = (probe.counts.sent[n] ?? 0) + 1
        super.send(data)
      }
    }
    window.WebSocket = CountingWebSocket as typeof WebSocket
  })
}

export async function resetProbe (page: Page) {
  await page.evaluate(() => window.__perfProbe.reset())
}

export async function readProbe (page: Page): Promise<ProbeCounts> {
  return await page.evaluate(() => JSON.parse(JSON.stringify(window.__perfProbe.counts)))
}

export function total (byName: Record<string, number>) {
  return Object.values(byName).reduce((a, b) => a + b, 0)
}
