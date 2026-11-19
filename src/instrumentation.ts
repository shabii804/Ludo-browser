// Next.js instrumentation — runs once when the server process starts.
//
// Dev convenience: auto-start the authoritative Ludo game server
// (mini-services/ludo-server, socket.io :3003) as a child of the Next
// server so online play works out of the box with `bun run dev`.
// - dev only (production uses .zscripts/mini-services-start.sh)
// - guarded by a TCP probe so we never double-bind the port

const GAME_PORT = 3003

function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const { connect } = require('net') as typeof import('net')
    const sock = connect({ port, host })
    const done = (open: boolean) => {
      sock.destroy()
      resolve(open)
    }
    sock.once('connect', () => done(true))
    sock.once('error', () => done(false))
    // if nothing answers in 700ms treat the port as closed
    setTimeout(() => done(false), 700).unref()
  })
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.NODE_ENV !== 'development') return
  try {
    if (await isPortOpen(GAME_PORT)) return // already running (e.g. manual start)
    const { spawn } = require('child_process') as typeof import('child_process')
    const path = require('path') as typeof import('path')
    const cwd = path.join(process.cwd(), 'mini-services', 'ludo-server')
    const child = spawn('bun', ['--hot', 'index.ts'], {
      cwd,
      stdio: 'ignore',
      detached: true,
      env: process.env,
    })
    child.unref()
    console.log(`[instrumentation] ludo-server spawned (pid ${child.pid}) on :${GAME_PORT}`)
  } catch (err) {
    console.error('[instrumentation] failed to spawn ludo-server:', err)
  }
}
