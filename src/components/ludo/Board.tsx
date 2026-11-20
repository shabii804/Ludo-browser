'use client'

// ============================================================
// Ludo Board — clean, Ludo Star style:
// each ACTIVE yard carries the player's profile avatar with a
// turn-timer ring; EVERY active corner holds a dice plate (only
// the turn player's plate is interactive, the rest are dimmed);
// tokens are premium 3D pawn pieces (gem cut + gold crown); ONLY the turn player's movable
// tokens glow (bots' movable tokens glow too, so you can always
// read whose turn it is); unused yards are dimmed gray.
// Geometry & interaction logic preserved.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Color, GameState } from '@/lib/ludo/types'
import {
  BOARD_SIZE,
  COLOR_HEX,
  FINISH_SLOTS,
  HOME_PATH,
  STAR_IDX,
  START_IDX,
  TRACK,
  YARD_BASE,
  YARD_SLOTS,
  tokenScreenPos,
} from '@/lib/ludo/board'
import { legalMoves } from '@/lib/ludo/engine'
import { DiceSlot } from '@/components/ludo/Dice'
import Pawn3D from '@/components/ludo/Pawn3D'
import { TURN_SECONDS } from '@/lib/ludo/constants'

interface BoardProps {
  game: GameState
  movableTokenIds: number[]
  onTokenClick: (tokenId: number) => void
  /** color controlled by the local human (for the YOU badge) */
  youColor: Color | null
  /**
   * color allowed to TAP tokens on this device right now:
   * local games = the turn player when they are human (pass-n-play),
   * online = your color only when it is your turn.
   */
  interactiveColor: Color | null
  animating: boolean
  emotes: Array<{ id: number; color: Color; emoji: string }>
  diceValues: number[]
  diceRolling: boolean
  canRoll: boolean
  onRoll?: () => void
  selectedDie?: number
  onSelectDie?: (i: number) => void
  /** seconds left in the current turn (drives the avatar timer ring) */
  turnRemainingSec?: number | null
}

const pct = (v: number) => `${(v / BOARD_SIZE) * 100}%`

/** how long a moved token keeps its "lift" movement emphasis (ms) */
const HOP_MS = 520

/** where quick-chat speech pills hover, per corner (toward the board center) */
const TEXT_PILL_POS: Record<Color, { c: number; r: number }> = {
  red: { c: 4.5, r: 4.3 },
  green: { c: 1.9, r: 4.3 },
  yellow: { c: 1.9, r: 6.9 },
  blue: { c: 4.5, r: 6.9 },
}

const CELL_BORDER = '#c9cdf2'
const CELL_BG = 'linear-gradient(160deg, #ffffff 0%, #eef1ff 100%)'
const SAFE_BG = 'linear-gradient(160deg, #f2f4ff 0%, #e3e8fb 100%)'

const BEVEL_LIGHT = 'inset 0 1.5px 0 rgba(255,255,255,0.9), inset 0 -2px 3px rgba(30,40,90,0.10)'

function cellStyle(isSafe: boolean, isStar: boolean, owner: Color | null) {
  if (owner) {
    const c = COLOR_HEX[owner]
    return {
      background: `linear-gradient(150deg, ${c.light} -18%, ${c.main} 55%, ${c.dark} 130%)`,
      border: `1px solid ${c.dark}`,
      boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.5), inset 0 -2px 3px rgba(0,0,0,0.22)',
    }
  }
  if (isSafe && !isStar) {
    return { background: SAFE_BG, border: `1px solid ${CELL_BORDER}`, boxShadow: BEVEL_LIGHT }
  }
  return { background: CELL_BG, border: `1px solid ${CELL_BORDER}`, boxShadow: BEVEL_LIGHT }
}

export default function Board({
  game,
  movableTokenIds,
  onTokenClick,
  youColor,
  interactiveColor,
  animating,
  emotes,
  diceValues,
  diceRolling,
  canRoll,
  onRoll,
  selectedDie,
  onSelectDie,
  turnRemainingSec,
}: BoardProps) {
  const turnColor = game.players[game.turn]?.color
  const turnPlayer = game.players[game.turn]

  /**
   * Which token ids GLOW. Only the TURN player's movable tokens ever
   * glow — for the local human this comes from the store (respects the
   * selected die); for bots & remote humans we derive it from the engine
   * so the active player is always readable.
   */
  const isLocalHumanTurn = !!interactiveColor && turnColor === interactiveColor && !!turnPlayer && !turnPlayer.isBot
  const glowTokenIds = useMemo(() => {
    if (animating || !turnPlayer || game.phase !== 'move') return []
    if (isLocalHumanTurn && movableTokenIds.length > 0) return movableTokenIds
    return [...new Set(legalMoves(game).map((m) => m.tokenId))]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animating, game, turnPlayer, isLocalHumanTurn, movableTokenIds])

  const glow = (color: Color, tokenId: number) =>
    !animating && game.phase === 'move' && color === turnColor && glowTokenIds.includes(tokenId)

  const clickable = (color: Color, tokenId: number) =>
    glow(color, tokenId) && interactiveColor === color

  // track + home cells
  const cells = useMemo(() => {
    const list: Array<{ key: string; r: number; c: number; owner: Color | null; star: boolean; start: boolean }> = []
    TRACK.forEach((cell, idx) => {
      const startColor =
        Object.entries(START_IDX).find(([, v]) => v === idx)?.[0] ?? null
      list.push({
        key: `t${idx}`,
        r: cell.r,
        c: cell.c,
        owner: (startColor as Color | null) ?? null,
        star: STAR_IDX.includes(idx),
        start: startColor !== null,
      })
    })
    ;(Object.keys(HOME_PATH) as Color[]).forEach((color) => {
      HOME_PATH[color].forEach((cell, i) => {
        list.push({ key: `h-${color}-${i}`, r: cell.r, c: cell.c, owner: color, star: false, start: false })
      })
    })
    return list
  }, [])

  // gather tokens grouped by cell for stacking
  const tokensByCell = useMemo(() => {
    const map = new Map<string, Array<{ color: Color; id: number }>>()
    for (const p of game.players) {
      for (const t of p.tokens) {
        if (t.location !== 'track') continue
        const key = `trk${t.trackIdx}`
        const arr = map.get(key) ?? []
        arr.push({ color: p.color, id: t.id })
        map.set(key, arr)
      }
    }
    return map
  }, [game])

  // movement emphasis: remembers each token's last cell so a token whose
  // cell changed gets a temporary lift (scale + glow) while it glides
  const prevPosRef = useRef<Map<string, string>>(new Map())
  const hopUntilRef = useRef<Map<string, number>>(new Map())

  // capture FX — when a token is knocked back home (track → yard)
  // a sparkling ring burst plays on the yard slot it lands in
  const prevLocRef = useRef<Map<string, string>>(new Map())
  const [captureFx, setCaptureFx] = useState<Array<{ key: string; color: Color; c: number; r: number }>>([])
  useEffect(() => {
    const found: Array<{ key: string; color: Color; c: number; r: number }> = []
    for (const p of game.players) {
      for (const t of p.tokens) {
        const k = `${p.color}-${t.id}`
        const prev = prevLocRef.current.get(k)
        if (prev === 'track' && t.location === 'yard') {
          const base = YARD_BASE[p.color]
          const slot = YARD_SLOTS[t.id % 4]
          found.push({ key: `${k}-${Date.now()}`, color: p.color, c: base.c + slot.c, r: base.r + slot.r })
        }
        prevLocRef.current.set(k, t.location)
      }
    }
    if (found.length > 0) {
      const keys = found.map((f) => f.key)
      setCaptureFx((fx) => [...fx, ...found])
      const timer = setTimeout(() => setCaptureFx((fx) => fx.filter((f) => !keys.includes(f.key))), 950)
      return () => clearTimeout(timer)
    }
  }, [game])

  return (
    <div className="relative w-full aspect-square select-none" style={{ maxWidth: 'min(92vw, 58vh)', margin: '0 auto' }}>
      {/* deep blue leather frame with beveled gold trim (Ludo Star table feel) */}
      <div
        className="absolute inset-0 rounded-[6%]"
        style={{
          background: 'linear-gradient(155deg, #1e4284 0%, #122a56 45%, #08122e 100%)',
          boxShadow:
            '0 26px 60px rgba(2,6,18,0.75), 0 0 46px rgba(59,130,246,0.20), inset 0 2px 0 rgba(147,197,253,0.32), inset 0 -5px 12px rgba(0,0,0,0.45), inset 3px 0 8px rgba(147,197,253,0.10), inset -3px 0 8px rgba(0,0,0,0.30)',
        }}
      />
      {/* frame gloss sweep */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[6%]"
        style={{
          background: 'linear-gradient(118deg, rgba(255,255,255,0.10) 0%, transparent 30%, transparent 72%, rgba(255,255,255,0.05) 100%)',
        }}
      />
      {/* two-tone beveled gold trim */}
      <div
        className="absolute inset-[1.8%] rounded-[5%]"
        style={{
          background: 'linear-gradient(180deg, #f6dd93 0%, #d9a636 55%, #b9851f 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,244,200,0.9), inset 0 -1px 0 rgba(90,50,0,0.5), 0 2px 6px rgba(0,0,0,0.35)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-[1.8%] rounded-[5%]"
        style={{
          background: 'linear-gradient(115deg, rgba(255,255,255,0.5) 2%, transparent 26%, transparent 78%, rgba(255,246,200,0.35) 98%)',
        }}
      />
      {/* dark well between trim and interior — adds height/depth */}
      <div
        className="absolute inset-[2.9%] rounded-[4.5%]"
        style={{
          background: 'linear-gradient(180deg, rgba(20,14,50,0.92), rgba(8,6,28,0.92))',
          boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.65)',
        }}
      />
      {/* board interior (sits inside the shadowed well) */}
      <div
        className="absolute inset-[3.4%] overflow-hidden rounded-[4%]"
        style={{ background: '#f2f4ff', boxShadow: 'inset 0 6px 16px rgba(8,12,40,0.30), inset 0 -5px 12px rgba(8,12,40,0.22)' }}
      >
        <div className="relative h-full w-full">
          {/* shared svg defs (safe-cell star gradient) */}
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="ls-star-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#e6ebff" />
                <stop offset="0.5" stopColor="#aeb7dd" />
                <stop offset="1" stopColor="#7d87b5" />
              </linearGradient>
            </defs>
          </svg>
          {/* soft interior vignette (under all pieces) */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(115% 115% at 50% 42%, transparent 62%, rgba(10,14,40,0.12) 100%)' }}
          />
          {/* yards */}
          {(Object.keys(YARD_BASE) as Color[]).map((color) => {
            const base = YARD_BASE[color]
            const c = COLOR_HEX[color]
            const isTurn = turnColor === color && game.phase !== 'gameover'
            // seats not used in this game (e.g. green/blue in 2P) render dimmed gray
            const player = game.players.find((p) => p.color === color)
            const active = !!player
            return (
              <div
                key={`yard-${color}`}
                className="absolute transition-shadow duration-300"
                style={{
                  left: pct(base.c),
                  top: pct(base.r),
                  width: pct(6),
                  height: pct(6),
                  background: `linear-gradient(150deg, ${c.light} -30%, ${c.main} 45%, ${c.dark} 125%)`,
                  borderRadius: '9%',
                  filter: active ? undefined : 'grayscale(0.92) brightness(0.72) opacity(0.5)',
                  boxShadow: isTurn
                    ? `inset 0 0 0 3px rgba(255,255,255,0.95), 0 0 26px 6px ${c.glow}`
                    : 'inset 0 -6px 12px rgba(0,0,0,0.28), inset 0 2px 0 rgba(255,255,255,0.35)',
                }}
              >
                {/* glossy white slot panel */}
                <div
                  className="absolute rounded-[10%]"
                  style={{
                    inset: '13%',
                    background: 'linear-gradient(160deg,#ffffff,#eef1fb)',
                    boxShadow: 'inset 0 2px 8px rgba(30,35,80,0.22), 0 1px 0 rgba(255,255,255,0.4)',
                  }}
                >
                  {/* profile avatar with turn-timer ring (active seats) */}
                  {player && (
                    <div className="absolute inset-x-0 top-[2%] z-10 flex justify-center">
                      <div className="relative" style={{ width: '44%' }}>
                        <div
                          className="relative grid aspect-square w-full place-items-center rounded-full"
                          style={{
                            background: `radial-gradient(circle at 32% 28%, ${c.light}, ${c.main} 62%, ${c.dark})`,
                            border: `2.5px solid ${isTurn ? '#ffffff' : 'rgba(255,255,255,0.75)'}`,
                            boxShadow: isTurn ? `0 0 12px 3px ${c.glow}` : '0 2px 5px rgba(2,4,16,0.4)',
                            fontSize: 'min(4.6vw, 22px)',
                            lineHeight: 1,
                          }}
                        >
                          <span className="drop-shadow">{player.avatar}</span>
                        </div>
                        {/* crown marker bobbing over the current player */}
                        {isTurn && (
                          <motion.span
                            className="pointer-events-none absolute left-1/2 z-20"
                            style={{ top: '-38%', fontSize: 'min(3.8vw, 19px)', filter: 'drop-shadow(0 2px 3px rgba(10,6,30,0.55))' }}
                            animate={{ x: '-50%', y: [0, -3.5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.15, ease: 'easeInOut' }}
                            aria-hidden
                          >
                            👑
                          </motion.span>
                        )}
                        {/* turn-timer ring (graph of the 10s budget) */}
                        {isTurn && turnRemainingSec != null && (
                          <>
                            <svg className="absolute -inset-[9%]" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(20,26,60,0.30)" strokeWidth="3.4" />
                              <circle
                                cx="20"
                                cy="20"
                                r="17"
                                fill="none"
                                stroke={turnRemainingSec <= 3 ? '#ef4444' : '#ffd23e'}
                                strokeWidth="3.4"
                                strokeLinecap="round"
                                strokeDasharray={`${Math.max(0, Math.min(1, turnRemainingSec / TURN_SECONDS)) * 106.8} 106.8`}
                              />
                            </svg>
                            <span
                              className="ls-font absolute -bottom-1.5 -right-1.5 rounded-full px-1 leading-tight"
                              style={{
                                background: turnRemainingSec <= 3
                                  ? 'linear-gradient(180deg,#f4695f,#b02820)'
                                  : 'linear-gradient(180deg,#ffe08a,#e09b1a)',
                                color: turnRemainingSec <= 3 ? '#fff' : '#4a2c00',
                                fontSize: 9,
                                fontWeight: 900,
                                boxShadow: '0 2px 5px rgba(2,4,16,0.45)',
                              }}
                            >
                              {turnRemainingSec}s
                            </span>
                          </>
                        )}
                        {/* you badge */}
                        {youColor === color && (
                          <span
                            className="ls-font absolute -left-2 -top-1 rounded-full px-1 leading-tight text-white"
                            style={{
                              background: 'linear-gradient(180deg,#3b82f6,#1d4ed8)',
                              fontSize: 8,
                              border: '1px solid rgba(255,255,255,0.85)',
                              boxShadow: '0 2px 4px rgba(2,4,16,0.4)',
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* token slots (bottom half of the panel) */}
                  <div className="absolute inset-x-[7%] bottom-[4%] top-[54%] grid grid-cols-2 grid-rows-2 place-items-center gap-[4%] p-[4%]">
                    {YARD_SLOTS.map((slot, i) => {
                      const token = player?.tokens[i]
                      const inYard = token?.location === 'yard'
                      return (
                        <div key={i} className="relative h-[82%] w-[82%]">
                          <span
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: 'linear-gradient(165deg, rgba(255,255,255,0.92), rgba(255,255,255,0.5))',
                              boxShadow: `inset 0 2px 5px rgba(30,35,80,0.2), inset 0 0 0 2.5px ${c.main}55, 0 1px 0 rgba(255,255,255,0.65)`,
                            }}
                          />
                          {inYard && token && (
                            <Pawn3D
                              color={color}
                              glow={glow(color, token.id)}
                              tap={clickable(color, token.id)}
                              onClick={() => onTokenClick(token.id)}
                              tokenId={token.id}
                              uid={`y${color}${token.id}`}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* name pill on the colored strip */}
                {player && (
                  <div className="absolute inset-x-0 bottom-[0.5%] flex justify-center">
                    <span
                      className="ls-font max-w-[94%] truncate rounded-full px-1.5 leading-tight text-white"
                      style={{
                        background: 'linear-gradient(180deg, rgba(10,14,40,0.72), rgba(10,14,40,0.55))',
                        border: '1px solid rgba(255,255,255,0.35)',
                        fontSize: 8.5,
                        textShadow: '0 1px 0 rgba(2,4,16,0.7)',
                      }}
                    >
                      {player.name.toUpperCase()}
                      {player.isBot ? ' · BOT' : ''}
                      {player.connected === false ? ' · OFF' : ''}
                    </span>
                  </div>
                )}
              </div>
            )
          })}

          {/* track + home cells */}
          {cells.map((cell) => {
            const style = cellStyle(!!cell.owner, cell.star, cell.owner)
            return (
              <div
                key={cell.key}
                className="absolute flex items-center justify-center"
                style={{
                  left: pct(cell.c),
                  top: pct(cell.r),
                  width: pct(1),
                  height: pct(1),
                  ...style,
                }}
              >
                {cell.star && (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[72%] w-[72%]"
                    style={{ filter: 'drop-shadow(0 1.5px 1px rgba(20,26,60,0.35))' }}
                  >
                    <path
                      d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"
                      fill="url(#ls-star-grad)"
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            )
          })}

          {/* center home triangles + beveled gold star medallion */}
          <div
            className="absolute"
            style={{ left: pct(6), top: pct(6), width: pct(3), height: pct(3), filter: 'drop-shadow(0 3px 6px rgba(10,14,40,0.45))' }}
          >
            <svg viewBox="0 0 90 90" className="h-full w-full">
              <defs>
                <radialGradient id="ls-med-ring" cx="0.5" cy="0.32" r="0.9">
                  <stop offset="0" stopColor="#ffe9a8" />
                  <stop offset="0.55" stopColor="#d9a636" />
                  <stop offset="1" stopColor="#a87712" />
                </radialGradient>
                <radialGradient id="ls-med-core" cx="0.42" cy="0.34" r="0.9">
                  <stop offset="0" stopColor="#fffdf4" />
                  <stop offset="0.72" stopColor="#f7efcf" />
                  <stop offset="1" stopColor="#e6d5a0" />
                </radialGradient>
                <linearGradient id="ls-med-star" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffe08a" />
                  <stop offset="0.55" stopColor="#f0a10c" />
                  <stop offset="1" stopColor="#c77b08" />
                </linearGradient>
              </defs>
              <polygon points="0,0 45,45 0,90" fill={COLOR_HEX.red.main} />
              <polygon points="0,0 45,45 90,0" fill={COLOR_HEX.green.main} />
              <polygon points="90,0 45,45 90,90" fill={COLOR_HEX.yellow.main} />
              <polygon points="0,90 45,45 90,90" fill={COLOR_HEX.blue.main} />
              {/* triangle sheens for a lit, dimensional center */}
              <polygon points="0,0 45,45 0,90" fill="rgba(255,255,255,0.18)" />
              <polygon points="90,0 45,45 90,90" fill="rgba(255,255,255,0.08)" />
              <polygon points="0,90 45,45 90,90" fill="rgba(0,0,0,0.12)" />
              <polygon points="90,0 45,45 90,90" fill="rgba(0,0,0,0.06)" />
              {/* medallion: dark seat → gold bevel ring → cream core → star */}
              <circle cx="45" cy="45" r="15" fill="#8a5c10" />
              <circle cx="45" cy="45" r="13.4" fill="url(#ls-med-ring)" />
              <circle cx="45" cy="45" r="10" fill="url(#ls-med-core)" stroke="#d9a636" strokeWidth="1.4" />
              <path
                d="M45 36.5l2.2 4.7 5.1.6-3.8 3.5 1 5-4.5-2.5-4.5 2.5 1-5-3.8-3.5 5.1-.6z"
                fill="url(#ls-med-star)"
                stroke="#8a5c10"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* finished tokens in center */}
          {(Object.keys(FINISH_SLOTS) as Color[]).map((color) =>
            game.players
              .find((p) => p.color === color)
              ?.tokens.filter((t) => t.location === 'finished')
              .map((t) => {
                const slot = FINISH_SLOTS[color][t.id % 4]
                const w = 0.72
                return (
                  <div
                    key={`fin-${color}-${t.id}`}
                    className="absolute"
                    style={{
                      left: `calc(${(slot.c / BOARD_SIZE) * 100}% - ${(w / 2 / BOARD_SIZE) * 100}%)`,
                      top: `calc(${(slot.r / BOARD_SIZE) * 100}% - ${(w / 2 / BOARD_SIZE) * 100}%)`,
                      width: pct(w),
                      height: pct(w),
                      pointerEvents: 'none',
                    }}
                  >
                    <Pawn3D color={color} glow={false} tap={false} onClick={() => undefined} tokenId={t.id} uid={`f${color}${t.id}`} />
                  </div>
                )
              })
          )}

          {/* tokens on track + home lane — smooth glide between cells.
              A token whose cell just changed gets a temporary "lift"
              (scale + colored glow) so every move reads clearly. */}
          {game.players.map((p) =>
            p.tokens
              .filter((t) => t.location === 'track' || t.location === 'home')
              .map((t) => {
                const stack = t.location === 'track' ? (tokensByCell.get(`trk${t.trackIdx}`) ?? []) : []
                const stackIndex = stack.findIndex((x) => x.color === p.color && x.id === t.id)
                const pos = tokenScreenPos(p.color, t.id, t.location, t.trackIdx, t.homeStep, stackIndex, stack.length)
                const w = 0.96
                const isGlowing = glow(p.color, t.id)
                // lift the token whose position just changed (movement emphasis)
                const tKey = `${p.color}-${t.id}`
                const posKey = `${pos.x.toFixed(2)}|${pos.y.toFixed(2)}`
                const prevKey = prevPosRef.current.get(tKey)
                if (prevKey && prevKey !== posKey) hopUntilRef.current.set(tKey, Date.now() + HOP_MS)
                prevPosRef.current.set(tKey, posKey)
                const hopping = (hopUntilRef.current.get(tKey) ?? 0) > Date.now()
                return (
                  <motion.div
                    key={`m-${p.color}-${t.id}`}
                    className="absolute"
                    style={{
                      left: `calc(${pos.x}% - ${(w / 2 / BOARD_SIZE) * 100}%)`,
                      top: `calc(${pos.y}% - ${(w / 2 / BOARD_SIZE) * 100}%)`,
                      width: pct(w),
                      height: pct(w),
                      zIndex: hopping ? 30 : isGlowing ? 25 : 15,
                      transition: 'left 300ms cubic-bezier(0.4, 0, 0.2, 1), top 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                      willChange: 'transform',
                    }}
                    animate={{ scale: hopping ? 1.28 : 1 }}
                    transition={{ type: 'spring', stiffness: 330, damping: hopping ? 14 : 20 }}
                  >
                    <Pawn3D
                      color={p.color}
                      glow={isGlowing}
                      tap={clickable(p.color, t.id)}
                      onClick={() => onTokenClick(t.id)}
                      tokenId={t.id}
                      uid={`t${p.color}${t.id}`}
                    />
                    {hopping && (
                      <span
                        className="pointer-events-none absolute inset-[-18%] rounded-full"
                        style={{ boxShadow: `0 8px 18px ${COLOR_HEX[p.color].glow}` }}
                      />
                    )}
                  </motion.div>
                )
              })
          )}

          {/* capture burst — sparkling ring where a knocked-out token lands home */}
          <AnimatePresence>
            {captureFx.map((f) => (
              <motion.div
                key={f.key}
                className="pointer-events-none absolute z-[45]"
                style={{
                  left: pct(f.c),
                  top: pct(f.r),
                  width: pct(2.6),
                  height: pct(2.6),
                  x: '-50%',
                  y: '-50%',
                }}
                initial={{ opacity: 0.95, scale: 0.4, rotate: 0 }}
                animate={{ opacity: 0, scale: 1.7, rotate: 60 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                aria-hidden
              >
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ border: `3px solid ${COLOR_HEX[f.color].light}`, boxShadow: `0 0 16px 5px ${COLOR_HEX[f.color].glow}` }}
                />
                <span className="absolute inset-[26%] rounded-full border-2 border-dashed" style={{ borderColor: '#ffd977' }} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* a dice plate in EVERY active player's corner — Ludo Star style.
              Only the turn player's plate is live; the others sit dimmed. */}
          {game.phase !== 'gameover' &&
            game.players.map((p) => (
              <DiceSlot
                key={`dice-${p.color}`}
                color={p.color}
                dimmed={p.color !== turnColor}
                values={p.color === turnColor ? diceValues : []}
                rolling={diceRolling && p.color === turnColor}
                canRoll={canRoll && p.color === turnColor}
                isYou={!!youColor && p.color === youColor}
                usedDice={p.color === turnColor ? game.usedDice : []}
                selectedDie={selectedDie ?? 0}
                onSelectDie={onSelectDie}
                onRoll={onRoll}
              />
            ))}

          {/* emote bubbles + quick-chat speech pills floating over the table */}
          <AnimatePresence>
            {emotes.map((e) => {
              const base = YARD_BASE[e.color]
              // text quick-chats ride the emote channel — render as a speech pill
              // anchored toward the board center; real emoji stay round bubbles
              if (e.emoji.length > 2) {
                const a = TEXT_PILL_POS[e.color]
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, scale: 0.6, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: -2 }}
                    exit={{ opacity: 0, scale: 0.8, y: -16 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                    className="ls-font absolute z-40 flex items-center justify-center rounded-2xl px-1.5 py-1 text-center leading-tight"
                    style={{
                      left: pct(a.c),
                      top: pct(a.r),
                      width: pct(5.6),
                      background: 'linear-gradient(180deg,#ffffff,#eef1fb)',
                      border: `2px solid ${COLOR_HEX[e.color].main}`,
                      boxShadow: `0 4px 10px rgba(10,14,40,0.4), 0 0 12px ${COLOR_HEX[e.color].glow}55`,
                      fontSize: 'min(2.6vw, 11.5px)',
                      color: '#1e2440',
                    }}
                  >
                    {e.emoji}
                  </motion.div>
                )
              }
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, scale: 0.4, y: 8 }}
                  animate={{ opacity: 1, scale: 1.15, y: -6 }}
                  exit={{ opacity: 0, scale: 0.5, y: -18 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="absolute z-40 flex items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-indigo-200"
                  style={{ left: pct(base.c + 2.2), top: pct(base.r + 0.6), width: pct(1.7), height: pct(1.7) }}
                >
                  <span style={{ fontSize: 'min(5vw, 26px)' }}>{e.emoji}</span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
