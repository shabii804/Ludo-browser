'use client'

// ============================================================
// Ludo Board - Ludo Star style: navy felt, glossy tokens,
// colored yards, star safe cells, animated movement.
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

interface BoardProps {
  game: GameState
  movableTokenIds: number[]
  onTokenClick: (tokenId: number) => void
  /** color controlled by the local human (for token click enable) */
  youColor: Color | null
  animating: boolean
  emotes: Array<{ id: number; color: Color; emoji: string }>
}

const pct = (v: number) => `${(v / BOARD_SIZE) * 100}%`

function cellStyle(isSafe: boolean, isStar: boolean, owner: Color | null) {
  if (owner) {
    const c = COLOR_HEX[owner]
    return { background: `linear-gradient(145deg, ${c.light}, ${c.main})`, border: `1px solid ${c.dark}` }
  }
  if (isSafe && !isStar) {
    return { background: '#f1f5f9', border: '1px solid #cbd5e1' }
  }
  return { background: '#f8fafc', border: '1px solid #e2e8f0' }
}

export default function Board({ game, movableTokenIds, onTokenClick, youColor, animating, emotes }: BoardProps) {
  const turnColor = game.players[game.turn]?.color
  const humanCanAct = !animating && movableTokenIds.length > 0

  // track + home cells
  const cells = useMemo(() => {
    const list: Array<{ key: string; r: number; c: number; owner: Color | null; star: boolean }> = []
    TRACK.forEach((cell, idx) => {
      const owner =
        Object.entries(START_IDX).find(([, v]) => v === idx)?.[0] ?? null
      list.push({
        key: `t${idx}`,
        r: cell.r,
        c: cell.c,
        owner: (owner as Color | null) ?? null,
        star: STAR_IDX.includes(idx),
      })
    })
    ;(Object.keys(HOME_PATH) as Color[]).forEach((color) => {
      HOME_PATH[color].forEach((cell, i) => {
        list.push({ key: `h-${color}-${i}`, r: cell.r, c: cell.c, owner: color, star: false })
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
    <div className="relative w-full aspect-square select-none" style={{ maxWidth: 'min(92vw, 62vh)', margin: '0 auto' }}>
      {/* board frame */}
      <div className="absolute inset-0 rounded-[4.5%] bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_18px_50px_rgba(0,0,0,0.55)] ring-2 ring-slate-700/80" />
      <div className="absolute inset-[1.6%] rounded-[3.5%] overflow-hidden bg-slate-100">
        <div className="relative w-full h-full">
          {/* yards */}
          {(Object.keys(YARD_BASE) as Color[]).map((color) => {
            const base = YARD_BASE[color]
            const c = COLOR_HEX[color]
            const isTurn = turnColor === color
            return (
              <div
                key={`yard-${color}`}
                className="absolute"
                style={{
                  left: pct(base.c),
                  top: pct(base.r),
                  width: pct(6),
                  height: pct(6),
                  background: `linear-gradient(140deg, ${c.main}, ${c.dark})`,
                  boxShadow: isTurn ? `0 0 0 3px rgba(255,255,255,0.85), 0 0 26px 6px ${c.glow}` : 'none',
                  borderRadius: '8%',
                  transition: 'box-shadow 0.3s',
                }}
              >
                {/* inner white circle */}
                <div className="absolute rounded-full bg-white/95" style={{ inset: '14%' }}>
                  {/* 4 slots */}
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 place-items-center p-[6%]">
                    {YARD_SLOTS.map((slot, i) => {
                      const token = game.players.find((p) => p.color === color)?.tokens[i]
                      const inYard = token?.location === 'yard'
                      return (
                        <div key={i} className="relative w-[62%] h-[62%]">
                          {inYard && (
                            <Token
                              color={color}
                              movable={humanCanAct && youColor === color && movableTokenIds.includes(token.id)}
                              onClick={() => onTokenClick(token.id)}
                              tokenId={token.id}
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
            const style = cellStyle(!!cell.owner || STAR_IDX.some((i) => TRACK[i].r === cell.r && TRACK[i].c === cell.c), cell.star, cell.owner)
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
                  <svg viewBox="0 0 24 24" className="w-[68%] h-[68%] text-slate-500 fill-current opacity-70">
                    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                  </svg>
                )}
              </div>
            )
          })}

          {/* center home triangles */}
          <div className="absolute" style={{ left: pct(6), top: pct(6), width: pct(3), height: pct(3) }}>
            <svg viewBox="0 0 90 90" className="w-full h-full drop-shadow">
              <polygon points="0,0 45,45 0,90" fill={COLOR_HEX.red.main} />
              <polygon points="0,0 45,45 90,0" fill={COLOR_HEX.green.main} />
              <polygon points="90,0 45,45 90,90" fill={COLOR_HEX.yellow.main} />
              <polygon points="0,90 45,45 90,90" fill={COLOR_HEX.blue.main} />
              <circle cx="45" cy="45" r="12" fill="#f8fafc" stroke="#334155" strokeWidth="2.5" />
              <path d="M45 38l2 4.2 4.6.5-3.4 3.1 1 4.5-4.2-2.3-4.2 2.3 1-4.5-3.4-3.1 4.6-.5z" fill="#f59e0b" />
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
                  <Token
                    key={`fin-${color}-${t.id}`}
                    color={color}
                    movable={false}
                    onClick={() => undefined}
                    tokenId={t.id}
                    style={{
                      left: `calc(${(slot.c / BOARD_SIZE) * 100}% - ${(w / 2 / BOARD_SIZE) * 100}%)`,
                      top: `calc(${(slot.r / BOARD_SIZE) * 100}% - ${(w / 2 / BOARD_SIZE) * 100}%)`,
                      width: pct(w),
                      height: pct(w),
                    }}
                  />
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
                const w = 0.8
                return (
                  <Token
                    key={`m-${p.color}-${t.id}`}
                    color={p.color}
                    movable={humanCanAct && youColor === p.color && movableTokenIds.includes(t.id)}
                    onClick={() => onTokenClick(t.id)}
                    tokenId={t.id}
                    style={{
                      left: `calc(${pos.x}% - ${(w / 2 / BOARD_SIZE) * 100}%)`,
                      top: `calc(${pos.y}% - ${(w / 2 / BOARD_SIZE) * 100}%)`,
                      width: pct(w),
                      height: pct(w),
                    }}
                  />
                )
              })
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
                  className="absolute z-30 flex items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-slate-200"
                  style={{ left: pct(base.c + 2.2), top: pct(base.r + 0.6), width: pct(1.7), height: pct(1.7), fontSize: pct(1.0) }}
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

// ---------------- Token ----------------

function Token({
  color,
  movable,
  onClick,
  tokenId,
  style,
}: {
  color: Color
  movable: boolean
  onClick: () => void
  tokenId: number
  style?: React.CSSProperties
}) {
  const c = COLOR_HEX[color]
  const posStyle: React.CSSProperties =
    style && style.left !== undefined
      ? { ...style, aspectRatio: '1' }
      : { inset: 0, margin: 'auto', width: '62%', height: '62%', aspectRatio: '1' }

  return (
    <motion.button
      data-token={`${color}-${tokenId}`}
      onClick={movable ? onClick : undefined}
      disabled={!movable}
      animate={movable ? { y: [0, -3.5, 0] } : { y: 0 }}
      transition={movable ? { repeat: Infinity, duration: 0.9, ease: 'easeInOut' } : { duration: 0.25 }}
      whileTap={movable ? { scale: 0.85 } : undefined}
      className={`absolute rounded-full ${movable ? 'cursor-pointer z-20' : 'z-10'}`}
      style={{
        ...posStyle,
        aspectRatio: '1',
        background: `radial-gradient(circle at 32% 28%, ${c.light} 0%, ${c.main} 42%, ${c.dark} 100%)`,
        border: `2px solid ${movable ? '#ffffff' : c.dark}`,
        boxShadow: movable
          ? `0 4px 10px rgba(0,0,0,0.45), 0 0 14px 4px ${c.glow}, inset 0 -3px 6px rgba(0,0,0,0.25)`
          : `0 3px 7px rgba(0,0,0,0.4), inset 0 -3px 6px rgba(0,0,0,0.28)`,
      }}
      aria-label={`${color} token ${tokenId}${movable ? ' (movable)' : ''}`}
    >
      {/* gloss highlight */}
      <span
        className="absolute rounded-full"
        style={{
          left: '18%',
          top: '12%',
          width: '34%',
          height: '26%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0) 72%)',
        }}
      />
      {movable && (
        <motion.span
          className="absolute inset-[-32%] rounded-full"
          style={{ border: `2.5px dashed ${c.light}`, opacity: 0.9 }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'linear' }}
        />
      )}
    </motion.button>
  )
}
