// The fake game: what the real app would see of Path of Exile. One instance
// per process, shared by the electron / uiohook / overlay-window stubs, and
// driven by tests through FakeApp (app.ts).
//
// - window: position, size and focus of the game window
// - screen: the pixels a screenshot returns (BGRA, like Windows)
// - hovered item: what Ctrl+C / Ctrl+Alt+C copies, like hovering an item
// - keyboard: keys the app presses are recorded, and chat lines / stash
//   searches it types are collected, so tests can check what reached the game
import { EventEmitter } from 'events'

export interface Bounds { x: number, y: number, width: number, height: number }

export interface KeyTap { key: string, mods: string[] }

class FakeGame extends EventEmitter {
  bounds: Bounds = { x: 0, y: 0, width: 1920, height: 1080 }
  focused = true
  // BGRA pixels, bounds.width * bounds.height * 4.
  screen: Uint8Array = new Uint8Array(1920 * 1080 * 4)
  screenFile: string | null = null
  hoveredItem: string | null = null
  cursor = { x: 960, y: 540 }

  clipboard = ''
  // Everything the app typed into the game, in order.
  keyTaps: KeyTap[] = []
  // Chat lines sent with Enter (from /commands, trade whispers, ...).
  chat: string[] = []
  // Text pasted into a stash/vendor search box (Ctrl+F, Ctrl+V).
  stashSearches: string[] = []

  // Keys held down, by the player (holding a hotkey) or by the app.
  private down = new Set<string>()

  // The player holds these keys while `fn` runs (e.g. Ctrl while pressing
  // Ctrl+D), then lets go. The app sees them held, as in the game.
  holdKeys (keys: string[], fn: () => void) {
    for (const k of keys) this.down.add(k)
    try { fn() } finally { for (const k of keys) this.down.delete(k) }
  }

  // uiohook keycodes -> names, filled by the uiohook stub.
  keyNames: Record<number, string> = {}

  // Called by the uiohook stub for every key the app presses or releases.
  onKey (code: number, toggle: 'tap' | 'down' | 'up') {
    const key = this.keyNames[code] ?? `#${code}`
    if (toggle === 'down') { this.down.add(key); return }
    if (toggle === 'up') { this.down.delete(key); return }
    const mods = ['Ctrl', 'Alt', 'Shift'].filter(m => this.down.has(m))
    this.keyTaps.push({ key, mods })
    this.emit('key', { key, mods })
    if (key === 'C' && mods.includes('Ctrl')) {
      // The game copies the hovered item (nothing when nothing is hovered).
      if (this.hoveredItem != null) this.clipboard = this.hoveredItem
    } else if (key === 'V' && mods.includes('Ctrl')) {
      this.pasteBuffer = this.clipboard
    } else if (key === 'F' && mods.includes('Ctrl')) {
      this.searchOpen = true
      this.pasteBuffer = ''
    } else if (key === 'Enter') {
      if (this.searchOpen) {
        this.stashSearches.push(this.pasteBuffer)
        this.searchOpen = false
      } else if (this.chatOpen) {
        if (this.pasteBuffer) this.chat.push(this.pasteBuffer)
        this.chatOpen = false
      } else {
        this.chatOpen = true
      }
      this.pasteBuffer = ''
    } else if (key === 'Escape') {
      this.chatOpen = false
      this.searchOpen = false
    }
  }

  private pasteBuffer = ''
  private chatOpen = false
  private searchOpen = false

  resetInputLog () {
    this.keyTaps = []
    this.chat = []
    this.stashSearches = []
    this.pasteBuffer = ''
    this.chatOpen = false
    this.searchOpen = false
  }
}

export const game = new FakeGame()
