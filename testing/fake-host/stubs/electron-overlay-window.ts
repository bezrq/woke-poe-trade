// Stand-in for electron-overlay-window: the "game window" is the fake game.
import { EventEmitter } from 'events'
import { game } from '../game'

export const OVERLAY_WINDOW_OPTS = {}

const events = new EventEmitter()

game.on('focus-change', (focused: boolean) => {
  events.emit(focused ? 'focus' : 'blur')
})

export const OverlayController = {
  events,
  get targetBounds () { return game.bounds },
  attachByTitle (_window: unknown, _title: string) {
    setTimeout(() => {
      events.emit('attach', { hasAccess: true, isFullscreen: false, ...game.bounds })
      if (game.focused) events.emit('focus')
    }, 10)
  },
  screenshot (): Buffer {
    return Buffer.from(game.screen.buffer, game.screen.byteOffset, game.screen.byteLength)
  },
  // The overlay takes focus: the game loses it.
  activateOverlay () {
    game.focused = false
    events.emit('blur')
  },
  focusTarget () {
    game.focused = true
    events.emit('focus')
  }
}
