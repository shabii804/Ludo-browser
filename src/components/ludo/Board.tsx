'use client'

// ============================================================
// Ludo Board — clean, Ludo Star style:
// each ACTIVE yard carries the player's profile avatar with a
// turn-timer ring; the dice renders in the turn player's yard
// corner; tokens glide smoothly cell-to-cell; unused yards are
// dimmed gray. Center is pure finish triangles (no clutter).
// Geometry & interaction logic preserved.
// ============================================================

import { useMemo } from 'react'
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
import { DiceSlot } from '@/components/ludo/Dice'
import { TURN_SECONDS } from '@/lib/ludo/constants'

interface BoardProps {
  game: GameState
  movableTokenIds: number[]
  onTokenClick: (tokenId: number) => void
  /** color controlled by the local human (for token click enable) */
  youColor: Color | null
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

const CELL_BORDER = '#c9cdf2'
const CELL_BG = 'linear-gradient(160deg, #ffffff 0%, #eef1ff 100%)'
const SAFE_BG = 'linear-gradient(160deg, #f2f4ff 0%, #e3e8fb 100%)'

function cellStyle(isSafe: boolean, isStar: boolean, owner: Color | null) {
  if (owner) {
    const c = COLOR_HEX[owner]
    return {
      background: `linear-gradient(150deg, ${c.light} -18%, ${c.main} 55%, ${c.dark} 130%)`,
      border: `1px solid ${c.dark}`,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
    }
  }
  if (isSafe && !isStar) {
    return { background: SAFE_BG, border: `1px solid ${CELL_BORDER}` }
  }
  return { background: CELL_BG, border: `1px solid ${CELL_BORDER}` }
}

export default function Board({
  game,
  movableTokenIds,
  onTokenClick,
  youColor,
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
  const humanCanAct = !animating && movableTokenIds.length > 0
  const turnPlayer = game.players[game.turn]

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

  return (
    <div className="relative w-full aspect-square select-none" style={{ maxWidth: 'min(92vw, 58vh)', margin: '0 auto' }}>
      {/* deep blue frame with gold trim (Ludo Star table feel) */}
      <div
        className="absolute inset-0 rounded-[6%]"
        style={{
          background: 'linear-gradient(155deg, #1c3f7a 0%, #122a56 45%, #0a1734 100%)',
          boxShadow:
            '0 24px 55px rgba(2,6,18,0.7), 0 0 40px rgba(59,130,246,0.18), inset 0 2px 0 rgba(147,197,253,0.30), inset 0 -4px 10px rgba(0,0,0,0.4)',
        }}
      />
      {/* gold trim ring */}
      <div
        className="absolute inset-[1.8%] rounded-[5%]"
        style={{
          background: 'linear-gradient(180deg, #f3d98b, #d9a636)',
          boxShadow: 'inset 0 1px 0 rgba(255,240,200,0.8), 0 2px 6px rgba(0,0,0,0.35)',
        }}
      />
      {/* board interior */}
      <div className="absolute inset-[3.4%] overflow-hidden rounded-[4%]" style={{ background: '#f2f4ff' }}>
        <div className="relative h-full w-full">
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
                              background: 'rgba(255,255,255,0.7)',
                              boxShadow: `inset 0 0 0 2.5px ${c.main}55, inset 0 2px 4px rgba(30,35,80,0.15)`,
                            }}
                          />
                          {inYard && token && (
                            <Pawn
                              color={color}
                              movable={humanCanAct && youColor === color && movableTokenIds.includes(token.id)}
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
                  <svg viewBox="0 0 24 24" className="h-[70%] w-[70%] fill-current text-[#8f97c4] opacity-90">
                    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                  </svg>
                )}
              </div>
            )
          })}

          {/* center home triangles + gold star medallion */}
          <div className="absolute" style={{ left: pct(6), top: pct(6), width: pct(3), height: pct(3) }}>
            <svg viewBox="0 0 90 90" className="h-full w-full">
              <polygon points="0,0 45,45 0,90" fill={COLOR_HEX.red.main} />
              <polygon points="0,0 45,45 90,0" fill={COLOR_HEX.green.main} />
              <polygon points="90,0 45,45 90,90" fill={COLOR_HEX.yellow.main} />
              <polygon points="0,90 45,45 90,90" fill={COLOR_HEX.blue.main} />
              <polygon points="0,0 45,45 0,90" fill="rgba(255,255,255,0.14)" />
              <polygon points="90,0 45,45 90,90" fill="rgba(0,0,0,0.10)" />
              <circle cx="45" cy="45" r="13" fill="#fdf8ea" stroke="#d9a636" strokeWidth="3" />
              <path
                d="M45 35.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z"
                fill="#f0a10c"
                stroke="#a05a08"
                strokeWidth="1.4"
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
                const w = 0.78
                return (
                  <div
                    key={`fin-${color}-${t.id}`}
                    className="absolute"
                    style={{
                      left: `calc(${(slot.c / BOARD_SIZE) * 100}% - ${(w / 2 / BOARD_SIZE) * 100}%)`,
                      top: `calc(${(slot.r / BOARD_SIZE) * 100}% - ${(w / 2 / BOARD_SIZE) * 100}%)`,
                      width: pct(w),
                      height: pct(w * 1.25),
                      pointerEvents: 'none',
                    }}
                  >
                    <Pawn color={color} movable={false} onClick={() => undefined} tokenId={t.id} uid={`f${color}${t.id}`} />
                  </div>
                )
              })
          )}

          {/* tokens on track + home lane — smooth glide between cells */}
          {game.players.map((p) =>
            p.tokens
              .filter((t) => t.location === 'track' || t.location === 'home')
              .map((t) => {
                const stack = t.location === 'track' ? (tokensByCell.get(`trk${t.trackIdx}`) ?? []) : []
                const stackIndex = stack.findIndex((x) => x.color === p.color && x.id === t.id)
                const pos = tokenScreenPos(p.color, t.id, t.location, t.trackIdx, t.homeStep, stackIndex, stack.length)
                const w = 1.0
                return (
                  <div
                    key={`m-${p.color}-${t.id}`}
                    className="absolute"
                    style={{
                      left: `calc(${pos.x}% - ${(w / 2 / BOARD_SIZE) * 100}%)`,
                      top: `calc(${pos.y}% - ${(w / 2 / BOARD_SIZE) * 100}%)`,
                      width: pct(w),
                      height: pct(w * 1.25),
                      transition: 'left 260ms cubic-bezier(0.4, 0, 0.2, 1), top 260ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <Pawn
                      color={p.color}
                      movable={humanCanAct && youColor === p.color && movableTokenIds.includes(t.id)}
                      onClick={() => onTokenClick(t.id)}
                      tokenId={t.id}
                      uid={`t${p.color}${t.id}`}
                    />
                  </div>
                )
              })
          )}

          {/* dice in the TURN player's yard corner */}
          {turnPlayer && game.phase !== 'gameover' && (
            <DiceSlot
              color={turnPlayer.color}
              values={diceValues}
              rolling={diceRolling}
              canRoll={canRoll}
              isYou={!!youColor && turnColor === youColor}
              usedDice={game.usedDice}
              selectedDie={selectedDie ?? 0}
              onSelectDie={onSelectDie}
              onRoll={onRoll}
            />
          )}

          {/* emote bubbles floating over yards */}
          <AnimatePresence>
            {emotes.map((e) => {
              const base = YARD_BASE[e.color]
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

// ---------------- Pawn (premium 3D token) ----------------

function Pawn({
  color,
  movable,
  onClick,
  tokenId,
  uid,
}: {
  color: Color
  movable: boolean
  onClick: () => void
  tokenId: number
  uid: string
}) {
  const c = COLOR_HEX[color]
  const skirtId = `sk-${uid}`
  const headId = `hd-${uid}`

  const svg = (
    <svg viewBox="0 0 64 80" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id={skirtId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.45" stopColor={c.main} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
        <radialGradient id={headId} cx="0.35" cy="0.28" r="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.55" stopColor={c.main} />
          <stop offset="1" stopColor={c.dark} />
        </radialGradient>
      </defs>
      {/* ground shadow */}
      <ellipse cx="32" cy="74" rx="17" ry="4.5" fill="rgba(20,24,60,0.35)" />
      {/* base */}
      <ellipse cx="32" cy="69.5" rx="17.5" ry="6.5" fill={c.dark} />
      {/* skirt */}
      <path
        d="M32 36 C 23 43 18.5 57 18 68.5 Q 32 76.5 46 68.5 C 45.5 57 41 43 32 36 Z"
        fill={`url(#${skirtId})`}
        stroke={c.dark}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* collar */}
      <ellipse cx="32" cy="37.5" rx="10.2" ry="4.8" fill={c.light} stroke={c.dark} strokeWidth="1.4" />
      {/* head */}
      <circle cx="32" cy="24" r="12.5" fill={`url(#${headId})`} stroke={c.dark} strokeWidth="1.4" />
      {/* crisp white outline so tokens read clearly on any cell */}
      <circle cx="32" cy="24" r="12.5" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" />
      <path d="M19.2 60 C 21 66 26 70.4 32 70.6 C 38 70.4 43 66 44.8 60" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
      {/* gloss */}
      <ellipse cx="27.5" cy="19.5" rx="4.8" ry="3.2" fill="rgba(255,255,255,0.92)" transform="rotate(-18 27.5 19.5)" />
      {/* rim light */}
      <path d="M44 40 C 45 50 45.8 60 46 68" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  )

  if (movable) {
    return (
      <motion.button
        data-token={`${color}-${tokenId}`}
        onClick={onClick}
        whileTap={{ scale: 0.82 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 0.85, ease: 'easeInOut' }}
        className="absolute inset-0 z-20 cursor-pointer"
        aria-label={`${color} token ${tokenId} (movable)`}
      >
        {svg}
        <motion.span
          className="absolute inset-[-12%] rounded-full"
          style={{ border: `2.5px dashed #ffd977` }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'linear' }}
        />
        <span
          className="absolute inset-[-12%] rounded-full"
          style={{ boxShadow: `0 0 16px 3px ${c.glow}` }}
        />
      </motion.button>
    )
  }

  return (
    <div className="absolute inset-0 z-10" aria-hidden>
      {svg}
    </div>
  )
}
