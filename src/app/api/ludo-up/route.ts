// Dev-only helper: ensure the authoritative Ludo game server
// (mini-services/ludo-server, socket.io :3003) is running.
// The spawned process becomes a child of the Next.js server, so it
// survives across hot reloads and works with `bun run dev` alone.
// Guarded: production is a no-op; never double-binds the port.

import { NextResponse } from 'next/server'

const GAME_PORT = 3003

function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const { connect } = require('net') as typeof import('net')
    const sock = connect({ port, host: '127.0.0.1' })
    const done = (open: boolean) => {
      sock.destroy()
      resolve(open)
    }
    sock.once('connect', () => done(true))
    sock.once('error', () => done(false))
    setTimeout(() => done(false), 700).unref()
  })
}

function spawnGameServer(): number | null {
  try {
    const { spawn } = require('child_process') as typeof import('child_process')
    const path = require('path') as typeof import('path')
    const { openSync } = require('fs') as typeof import('fs')
    const cwd = path.join(process.cwd(), 'mini-services', 'ludo-server')
    const logPath = path.join(process.cwd(), '.zscripts', 'mini-service-ludo-server.log')
    let out: number
    try {
      out = openSync(logPath, 'a')
    } catch {
      out = 'ignore' as unknown as number
    }
    const child = spawn('bun', ['--hot', 'index.ts'], {
      cwd,
      stdio: ['ignore', out, out],
      detached: true,
      env: process.env,
    })
    child.unref()
    return child.pid ?? null
  } catch {
    return null
  }
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, reason: 'dev-only endpoint' }, { status: 404 })
  }
  if (await isPortOpen(GAME_PORT)) {
    return NextResponse.json({ ok: true, running: true, port: GAME_PORT })
  }
  const pid = spawnGameServer()
  // give the server a moment to bind
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 250))
    if (await isPortOpen(GAME_PORT)) break
  }
  const running = await isPortOpen(GAME_PORT)
  return NextResponse.json({ ok: running, spawnedPid: pid, port: GAME_PORT })
}
