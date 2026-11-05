// woke: a held key must not repeat an action. Key repeat runs at about 30 presses
// a second, far quicker than anyone presses a key by hand, so a press this soon
// after the last one (counting ones already ignored) belongs to the same hold.
// The long pause before a key starts repeating can still let one more through.
const SAME_HOLD_MS = 80

export function makeRepeatGuard (now: () => number = () => performance.now()) {
  const lastSeen = new Map<string, number>()
  return (shortcut: string): boolean => {
    const at = now()
    const last = lastSeen.get(shortcut)
    lastSeen.set(shortcut, at)
    return last !== undefined && at - last < SAME_HOLD_MS
  }
}
