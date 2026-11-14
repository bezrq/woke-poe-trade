// Moves the mouse cursor, for the Fates sweep: gear rewards only say their
// modifier in a tooltip, which the game shows while the cursor is on them.
// Electron can't move the cursor, so one PowerShell process stays up while
// it's being used and calls SetCursorPos (user32) for each "x y" line sent to
// its stdin (the script itself goes in as an argument).
// Windows only. It only moves the cursor: no clicks, no keys.
import { spawn } from 'child_process'
import type { ChildProcessWithoutNullStreams } from 'child_process'

const IDLE_MS = 2 * 60 * 1000
const SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  "Add-Type -Namespace WokeCursor -Name Win -MemberDefinition '[DllImport(\"user32.dll\")] public static extern bool SetCursorPos(int x, int y); [DllImport(\"user32.dll\")] public static extern bool SetProcessDPIAware();'",
  // Physical pixels, the same as the screenshots and uiohook.
  '[WokeCursor.Win]::SetProcessDPIAware() | Out-Null',
  "[Console]::Out.WriteLine('ready')",
  'while (($line = [Console]::In.ReadLine()) -ne $null) {',
  "  $p = $line.Split(' ')",
  '  [WokeCursor.Win]::SetCursorPos([int]$p[0], [int]$p[1]) | Out-Null',
  "  [Console]::Out.WriteLine('ok')",
  '}'
].join('\n')

let proc: ChildProcessWithoutNullStreams | null = null
let ready: Promise<void> | null = null
let idle: ReturnType<typeof setTimeout> | undefined
const waiting: Array<() => void> = []

function start (): Promise<void> {
  if (ready) return ready
  ready = new Promise<void>((resolve, reject) => {
    const encoded = Buffer.from(SCRIPT, 'utf16le').toString('base64')
    const p = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded], { windowsHide: true })
    proc = p
    let buf = ''
    let up = false
    p.stdout.on('data', (chunk: Buffer) => {
      buf += chunk.toString()
      let nl: number
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)
        if (line === 'ready' && !up) { up = true; resolve() } else if (line === 'ok') waiting.shift()?.()
      }
    })
    p.on('exit', () => {
      proc = null
      ready = null
      while (waiting.length) waiting.shift()?.()
      if (!up) reject(new Error('Could not start the cursor helper'))
    })
  })
  return ready
}

function stopLater () {
  clearTimeout(idle)
  idle = setTimeout(() => { proc?.stdin.end(); proc?.kill() }, IDLE_MS)
}

export function canMoveCursor (): boolean {
  return process.platform === 'win32'
}

// Puts the cursor at (x, y) in physical screen pixels; resolves once it's there.
export async function moveCursor (x: number, y: number): Promise<void> {
  if (!canMoveCursor()) return
  await start()
  stopLater()
  await new Promise<void>(resolve => {
    waiting.push(resolve)
    proc?.stdin.write(`${Math.round(x)} ${Math.round(y)}\n`)
  })
}
