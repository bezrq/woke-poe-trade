// Hover zones for woke widgets. While the game has focus the overlay window is
// click-through, so the renderer never sees mouse hover. Widgets register
// screen rects here; we watch the global mouse and tell them when it enters
// or leaves. A zone marked `activate` also takes the mouse after it rests there
// briefly, and hands focus back to the game when it leaves, so the zone gets
// clicks instead of the game, without pressing the overlay key. That doesn't
// open the overlay: see OverlayWindow.assertCardActive.
import { screen } from 'electron'
import type { Rectangle } from 'electron'
import { uIOhook } from 'uiohook-napi'
import type { UiohookMouseEvent } from 'uiohook-napi'
import type { ServerEvents } from '../server'
import type { OverlayWindow } from '../windowing/OverlayWindow'

const ACTIVATE_DWELL_MS = 120
// Long enough to cross the gap between an icon and its card without handing
// focus back and taking it again.
const LEAVE_GRACE_MS = 100
// After something hands focus to the game on purpose (a trade reply is typing
// into chat), a twitch of the mouse mustn't take it back mid-message.
const REACTIVATE_AFTER_MS = 600
const LEFT_BUTTON = 1

interface Zone {
  id: string
  rect: Rectangle
  activate: boolean
  inside?: boolean
}

export class WokeHoverTracker {
  private zones = new Map<string, Zone[]>()
  // All zones in one array, rebuilt when zones change, so the mousemove
  // handler (hundreds of calls a second with a gaming mouse) allocates nothing.
  private flat: Zone[] = []
  private listening = false
  private dwellTimer: ReturnType<typeof setTimeout> | null = null
  private leaveTimer: ReturnType<typeof setTimeout> | null = null
  private activatedByUs = false
  private noActivateUntil = 0
  // Holding a button means moving or casting: never take focus from that.
  private heldButtons = new Set<unknown>()

  constructor (
    private server: ServerEvents,
    private overlay: OverlayWindow
  ) {
    this.server.onEventAnyClient('OVERLAY->MAIN::woke-hover-zones', ({ owner, zones }) => {
      const prev = this.zones.get(owner) ?? []
      const converted: Zone[] = zones.map(z => ({
        id: z.id,
        activate: Boolean(z.activate),
        rect: toScreenRect({ x: z.x, y: z.y, width: z.width, height: z.height }),
        inside: prev.find(p => p.id === z.id)?.inside ?? false
      }))
      for (const p of prev) {
        if (p.inside && !converted.some(z => z.id === p.id)) this.emit(p.id, false)
      }
      if (converted.length) this.zones.set(owner, converted)
      else this.zones.delete(owner)
      this.flat = [...this.zones.values()].flat()
      this.updateListening()
    })
  }

  private updateListening () {
    const want = this.zones.size > 0
    if (want && !this.listening) {
      uIOhook.addListener('mousemove', this.handleMouseMove)
      uIOhook.addListener('mousedown', this.handleMouseDown)
      uIOhook.addListener('mouseup', this.handleMouseUp)
      this.listening = true
    } else if (!want && this.listening) {
      uIOhook.removeListener('mousemove', this.handleMouseMove)
      uIOhook.removeListener('mousedown', this.handleMouseDown)
      uIOhook.removeListener('mouseup', this.handleMouseUp)
      this.listening = false
      this.heldButtons.clear()
      this.leaveActivateZone()
      this.flushLeave()
    }
  }

  private readonly handleMouseMove = (e: UiohookMouseEvent) => {
    // Something handed focus back to the game (a trade reply typed into
    // chat): resting on the zone again makes it clickable again. The overlay
    // key opening the overlay ends our part too, and leaving mustn't close it.
    if (this.activatedByUs && !this.overlay.isCardActive) {
      this.activatedByUs = false
      this.noActivateUntil = Date.now() + REACTIVATE_AFTER_MS
    }
    let inActivateZone = false
    for (const zone of this.flat) {
      const inside = contains(zone.rect, e.x, e.y)
      if (inside !== zone.inside) {
        zone.inside = inside
        this.emit(zone.id, inside)
      }
      if (inside && zone.activate) inActivateZone = true
    }

    if (inActivateZone) this.enterActivateZone()
    else this.leaveActivateZone()
  }

  private readonly handleMouseUp = (e: UiohookMouseEvent) => {
    this.heldButtons.delete(e.button)
    this.handleMouseMove(e)
  }

  private readonly handleMouseDown = (e: UiohookMouseEvent) => {
    this.heldButtons.add(e.button)
    // Bring `inside` up to date first, so a click also counts as entering.
    this.handleMouseMove(e)
    // Clicking away means back to the game, right now.
    if (!this.flat.some(z => z.inside && z.activate)) this.flushLeave()
    if (e.button !== LEFT_BUTTON) return
    for (const zone of this.flat) {
      if (zone.inside) {
        this.server.sendEventTo('broadcast', { name: 'MAIN->OVERLAY::woke-hover-click', payload: { id: zone.id } })
      }
    }
  }

  private canActivate () {
    return !this.overlay.isInteractable &&
      // Zones stay registered while you're in another program.
      this.overlay.isGameActive &&
      this.heldButtons.size === 0 &&
      Date.now() >= this.noActivateUntil
  }

  private enterActivateZone () {
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer)
      this.leaveTimer = null
    }
    if (this.dwellTimer || this.activatedByUs || !this.canActivate()) return
    this.dwellTimer = setTimeout(() => {
      this.dwellTimer = null
      if (this.canActivate() && this.flat.some(z => z.inside && z.activate)) {
        this.overlay.assertCardActive()
        this.activatedByUs = true
      }
    }, ACTIVATE_DWELL_MS)
  }

  private leaveActivateZone () {
    if (this.dwellTimer) {
      clearTimeout(this.dwellTimer)
      this.dwellTimer = null
    }
    if (this.activatedByUs && !this.leaveTimer) {
      this.leaveTimer = setTimeout(() => this.flushLeave(), LEAVE_GRACE_MS)
    }
  }

  private flushLeave () {
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer)
      this.leaveTimer = null
    }
    if (this.activatedByUs) {
      this.activatedByUs = false
      this.overlay.releaseCard()
    }
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
