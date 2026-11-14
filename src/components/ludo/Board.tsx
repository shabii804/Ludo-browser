'use client'

// ============================================================
// Ludo Board — premium navy/gold framed board:
// colored yards with glossy slot panels, crisp track cells,
// 3D pawn tokens, star safe cells, dice in the center.
// Geometry & interaction logic unchanged.
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
import DiceCenter from '@/components/ludo/Dice'

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
      {/* deep navy frame with purple glow */}
      <div
        className="absolute inset-0 rounded-[6%]"
        style={{
          background: 'linear-gradient(155deg, #33386e 0%, #1d2148 45%, #10122e 100%)',
          boxShadow:
            '0 24px 55px rgba(2,4,16,0.7), 0 0 40px rgba(124,58,237,0.22), inset 0 2px 0 rgba(196,181,253,0.35), inset 0 -4px 10px rgba(0,0,0,0.4)',
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
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 place-items-center p-[7%]">
                    {YARD_SLOTS.map((slot, i) => {
                      const token = game.players.find((p) => p.color === color)?.tokens[i]
                      const inYard = token?.location === 'yard'
                      return (
                        <div key={i} className="relative h-[80%] w-[80%]">
                          {/* empty slot circle */}
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

          {/* tokens on track + home lane */}
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

          {/* dice lives in the center */}
          <DiceCenter
            values={diceValues}
            rolling={diceRolling}
            canRoll={canRoll}
            color={turnColor ?? 'red'}
            isYou={!!youColor && turnColor === youColor}
            playerName={turnPlayer?.name ?? ''}
            usedDice={game.usedDice}
            selectedDie={selectedDie ?? 0}
            onSelectDie={onSelectDie}
            onRoll={onRoll}
          />

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
        animate={{ y: [0, -4, 0] }}
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
