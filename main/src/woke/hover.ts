// Hover zones for woke widgets. While the game has focus the overlay window is
// click-through, so the renderer never sees mouse hover. Widgets register
// screen rects here; we watch the global mouse and tell them when it enters
// or leaves. A zone marked `activate` also makes the overlay interactive after
// the mouse rests on it briefly, and hands focus back to the game when the
// mouse leaves, so its buttons can be clicked without pressing the overlay key.
import { screen } from 'electron'
import type { Rectangle } from 'electron'
import { uIOhook } from 'uiohook-napi'
import type { UiohookMouseEvent } from 'uiohook-napi'
import type { ServerEvents } from '../server'
import type { OverlayWindow } from '../windowing/OverlayWindow'

const ACTIVATE_DWELL_MS = 350

interface Zone {
  id: string
  rect: Rectangle
  activate: boolean
}

export class WokeHoverTracker {
  private zones = new Map<string, Zone[]>()
  private inside = new Set<string>()
  private listening = false
  private dwellTimer: ReturnType<typeof setTimeout> | null = null
  private activatedByUs = false

  constructor (
    private server: ServerEvents,
    private overlay: OverlayWindow
  ) {
    this.server.onEventAnyClient('OVERLAY->MAIN::woke-hover-zones', ({ owner, zones }) => {
      const converted = zones.map(z => ({
        id: z.id,
        activate: Boolean(z.activate),
        rect: toScreenRect({ x: z.x, y: z.y, width: z.width, height: z.height })
      }))
      if (converted.length) this.zones.set(owner, converted)
      else this.zones.delete(owner)
      this.updateListening()
    })
  }

  private updateListening () {
    const want = this.zones.size > 0
    if (want && !this.listening) {
      uIOhook.addListener('mousemove', this.handleMouseMove)
      this.listening = true
    } else if (!want && this.listening) {
      uIOhook.removeListener('mousemove', this.handleMouseMove)
      this.listening = false
      for (const id of this.inside) this.emit(id, false)
      this.inside.clear()
      this.leaveActivateZone()
    }
  }

  private readonly handleMouseMove = (e: UiohookMouseEvent) => {
    let inActivateZone = false
    const nowInside = new Set<string>()
    for (const list of this.zones.values()) {
      for (const zone of list) {
        if (contains(zone.rect, e.x, e.y)) {
          nowInside.add(zone.id)
          if (zone.activate) inActivateZone = true
        }
      }
    }
    for (const id of nowInside) if (!this.inside.has(id)) this.emit(id, true)
    for (const id of this.inside) if (!nowInside.has(id)) this.emit(id, false)
    this.inside = nowInside

    if (inActivateZone) this.enterActivateZone()
    else this.leaveActivateZone()
  }

  private enterActivateZone () {
    if (this.dwellTimer || this.activatedByUs || this.overlay.isInteractable) return
    this.dwellTimer = setTimeout(() => {
      this.dwellTimer = null
      if (!this.overlay.isInteractable && [...this.inside].some(id => this.isActivateZone(id))) {
        this.overlay.assertOverlayActive()
        this.activatedByUs = true
      }
    }, ACTIVATE_DWELL_MS)
  }

  private leaveActivateZone () {
    if (this.dwellTimer) {
      clearTimeout(this.dwellTimer)
      this.dwellTimer = null
    }
    if (this.activatedByUs) {
      this.activatedByUs = false
      if (this.overlay.isInteractable) this.overlay.assertGameActive()
    }
  }

  private isActivateZone (id: string): boolean {
    for (const list of this.zones.values()) {
      if (list.some(z => z.id === id && z.activate)) return true
    }
    return false
  }

  private emit (id: string, inside: boolean) {
    this.server.sendEventTo('broadcast', { name: 'MAIN->OVERLAY::woke-hover', payload: { id, inside } })
  }
}

function toScreenRect (rect: Rectangle): Rectangle {
  // Same conversion as APT's WidgetAreaTracker: uiohook reports physical
  // pixels on Windows, CSS pixels elsewhere.
  if (process.platform === 'win32') {
    return screen.dipToScreenRect(null, {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    })
  }
  return rect
}

function contains (rect: Rectangle, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}
