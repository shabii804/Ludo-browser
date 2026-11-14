// ============================================================
// Socket.io client wrapper for the online game server
// Connects through the gateway using XTransformPort
// ============================================================

import { io, type Socket } from 'socket.io-client'

const PORT = '3003'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/?XTransformPort=' + PORT, {
      path: '/',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
      timeout: 8000,
    })
  }
  return socket
}

export const online = {
  connect() {
    getSocket().connect()
  },
  connected() {
    return getSocket().connected
  },
  emit(event: string, payload?: unknown) {
    getSocket().emit(event, payload)
  },
  on<T = unknown>(event: string, handler: (payload: T) => void) {
    const s = getSocket()
    // avoid duplicate handlers across StrictMode remounts
    s.off(event)
    s.on(event, handler as (...args: unknown[]) => void)
  },
  off(event: string) {
    getSocket().off(event)
  },
  disconnect() {
    socket?.disconnect()
    socket = null
  },
}
