// Direct smoke test: quick match -> bot fill -> game starts -> bots drive turns
import { io } from 'socket.io-client'

const URL = process.env.URL || 'http://localhost:3003'
const sock = io(URL, { transports: ['websocket'] })

const t0 = Date.now()
const log = (m: string) => console.log(`[+${Date.now() - t0}ms] ${m}`)

sock.on('connect', () => {
  log('connected ' + sock.id)
  sock.emit('lobby:quick', {
    profile: { id: 'smoke-' + Date.now(), name: 'SmokeTest', avatar: '🤖' },
    stake: 50,
    mode: 'classic',
  })
})

sock.on('lobby:created', ({ code }) => log('room created: ' + code))
sock.on('lobby:update', ({ room }) => log('lobby update: players=' + room.players.length))
sock.on('lobby:error', ({ message }) => log('ERROR: ' + message))
sock.on('game:started', ({ state, yourColor }) => {
  log(`GAME STARTED yourColor=${yourColor} turn=${state.players[state.turn].name} phase=${state.phase}`)
})
sock.on('game:rolled', ({ rolled }) => log('rolled: ' + rolled.join(',')))
sock.on('game:moved', ({ move }) => log(`moved color=${move.color} token=${move.tokenId} die=${move.die} captures=${move.captures.length}`))
sock.on('game:passed', ({ reason }) => log('passed: ' + reason))
sock.on('game:state', () => log('state sync'))
sock.on('game:over', ({ winner }) => { log('GAME OVER winner=' + winner); process.exit(0) })
sock.on('connect_error', (e) => log('connect_error: ' + e.message))

// my turn? force a quick roll so the game keeps moving
sock.on('game:started', () => {
  setInterval(() => {
    const s = (sock as unknown as { __lastPhase?: string }).__lastPhase
    void s
    sock.emit('game:roll')
    sock.emit('game:move', { tokenId: 0, dieIndex: 0 })
  }, 1500)
})
sock.on('game:rolled', () => { (sock as unknown as { __lastPhase: string }).__lastPhase = 'move' })

setTimeout(() => {
  log('TIMEOUT — no game over in 45s, aborting observation')
  process.exit(1)
}, 45000)
