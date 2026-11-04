// Request/response calls to woke handlers in the main process (main/src/woke).
import { MainProcess } from '@/web/background/IPC'

// Random start: responses are broadcast, so ids must not clash between clients.
let nextId = Math.floor(Math.random() * 1e9)
const pending = new Map<number, { resolve: (v: unknown) => void, reject: (e: Error) => void }>()
let listening = false

function listen () {
  if (listening) return
  listening = true
  MainProcess.onEvent('MAIN->CLIENT::woke-response', ({ id, ok, data, error }) => {
    const req = pending.get(id)
    if (!req) return
    pending.delete(id)
    if (ok) req.resolve(data)
    else req.reject(new Error(error ?? 'Request failed'))
  })
}

export function hostRequest<T> (op: string, args: unknown, timeoutMs = 30_000): Promise<T> {
  listen()
  const id = nextId++
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error('The app did not respond'))
    }, timeoutMs)
    pending.set(id, {
      resolve: (v) => { clearTimeout(timer); resolve(v as T) },
      reject: (e) => { clearTimeout(timer); reject(e) }
    })
    MainProcess.sendEvent({ name: 'CLIENT->MAIN::woke-request', payload: { id, op, args } })
  })
}
