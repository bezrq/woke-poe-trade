import { WebSocketServer, type WebSocket } from 'ws'
import { type AddressInfo } from 'net'
import { createServer } from 'http'
import { EventEmitter } from 'events'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { IpcEvent, IpcEventPayload, HostState } from '../../ipc/types'
import { ConfigStore } from './host-files/ConfigStore'
import { addFileUploadRoutes } from './host-files/file-uploads'
import type { AppUpdater } from './AppUpdater'
import type { Logger } from './RemoteLogger'

export const server = createServer()
const websocketServer = new WebSocketServer({ noServer: true })
let lastActiveClient: WebSocket

addFileUploadRoutes(server)

if (!process.env.VITE_DEV_SERVER_URL) {
  server.addListener('request', (req, res) => {
    if (req.url?.startsWith('/config') || req.url?.startsWith('/uploads') || req.url?.startsWith('/proxy')) return

    const filePath = (req.url === '/') ? '/index.html' : req.url!
    switch (path.extname(filePath)) {
      case '.html': res.setHeader('content-type', 'text/html'); break;
      case '.js': res.setHeader('content-type', 'text/javascript'); break;
      case '.json': res.setHeader('content-type', 'application/json'); break;
      case '.svg': res.setHeader('content-type', 'image/svg+xml'); break;
    }

    fs.createReadStream(path.join(__dirname, filePath))
      .pipe(res)
  })
}

const evBus = new EventEmitter()

export function onEventAnyClient<Name extends IpcEvent['name']> (
  name: Name,
  cb: (payload: IpcEventPayload<Name>) => void
) {
  evBus.on(name, cb)
}

export function sendEventTo (
  target: 'last-active' | 'any' | 'broadcast',
  event: IpcEvent
) {
  const msg = JSON.stringify(event)
  if (target === 'broadcast') {
    for (const client of websocketServer.clients) {
      client.send(msg)
    }
  } else {
    lastActiveClient.send(msg)
  }
}

export interface ServerEvents {
  onEventAnyClient: typeof onEventAnyClient
  sendEventTo: typeof sendEventTo
}
export const eventPipe = {
  onEventAnyClient,
  sendEventTo
}

server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/events' && req.url !== '/events?role=setup') {
    return req.destroy()
  }
  websocketServer.handleUpgrade(req, socket, head, (ws) => {
    websocketServer.emit('connection', ws, req)
  })
})

export async function startServer (
  appUpdater: AppUpdater,
  logger: Logger
): Promise<number> {
  const configStore = new ConfigStore(eventPipe)

  websocketServer.on('connection', (socket, req) => {
    // woke: the setup window is never where item checks should go.
    const isSetupWindow = Boolean((req as { url?: string } | undefined)?.url?.includes('role=setup'))
    if (!isSetupWindow || !lastActiveClient) lastActiveClient = socket
    socket.on('message', (bytes) => {
      const event = JSON.parse(bytes.toString('utf-8')) as IpcEvent
      if (event.name === 'CLIENT->MAIN::used-recently') {
        lastActiveClient = socket
      }
      evBus.emit(event.name, event.payload)
    })
    socket.on('close', () => {
      const clients = websocketServer.clients
      if (clients.size === 1) {
        lastActiveClient = clients.values().next().value!
        evBus.emit('CLIENT->MAIN::used-recently', { isOverlay: true })
      }
    })
    socket.send(JSON.stringify({
      name: 'MAIN->CLIENT::log-entry',
      payload: { message: logger.history }
    } satisfies IpcEvent))
  })

  server.addListener('request', async (req, res) => {
    if (req.url === '/config') {
      res.setHeader('content-type', 'application/json')
      const resBody: HostState = {
        version: app.getVersion(),
        updater: appUpdater.info,
        contents: await configStore.load()
      }
      res.end(JSON.stringify(resBody))
    }
  })

  // woke: a fixed port, because the overlay's saved data (market history) is
  // tied to its address. Falls back to any free port if something else has it.
  let port = (process.env.VITE_DEV_SERVER_URL) ? 8584 : 8585
  let host = '127.0.0.1'
  // --listen=[host][:port]
  const listenOpt = process.argv.find(arg => arg.startsWith('--listen'))
  if (listenOpt) {
    const [hostArg, portArg] = listenOpt.split('=')[1].split(':')
    if (hostArg) host = hostArg
    if (portArg) port = parseInt(portArg, 10)
  }

  return new Promise((resolve, reject) => {
    server.once('listening', () => {
      resolve((server.address() as AddressInfo).port)
    })
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && !listenOpt && !process.env.VITE_DEV_SERVER_URL && port !== 0) {
        port = 0
        server.listen({ port, host })
      } else {
        reject(err)
      }
    })
    server.listen({ port, host })
  })
}
