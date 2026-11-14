'use client'

// Player card with avatar, turn glow, timer ring, emote bubble

import { motion, AnimatePresence } from 'framer-motion'
import type { Color } from '@/lib/ludo/types'
import { COLOR_HEX } from '@/lib/ludo/board'
import { TURN_SECONDS } from '@/lib/ludo/constants'

export interface PlayerCardData {
  color: Color
  name: string
  avatar: string
  isBot: boolean
  isTurn: boolean
  tokensHome: number
  tokensFinished: number
  captured: number
  connected?: boolean
}

export default function PlayerCard({
  player,
  remainingSec,
  emote,
  compact,
}: {
  player: PlayerCardData
  remainingSec: number | null
  emote?: { id: number; emoji: string } | null
  compact?: boolean
}) {
  const c = COLOR_HEX[player.color]
  const timerPct = remainingSec === null ? 0 : Math.max(0, Math.min(1, remainingSec / TURN_SECONDS))

  return (
    <div
      className={`relative flex items-center gap-2.5 rounded-2xl px-3 ${compact ? 'py-1.5' : 'py-2.5'} transition-all`}
      style={{
        background: player.isTurn ? `linear-gradient(120deg, ${c.dark}55, rgba(15,23,42,0.85))` : 'rgba(15,23,42,0.72)',
        border: `1.5px solid ${player.isTurn ? c.main : 'rgba(71,85,105,0.45)'}`,
        boxShadow: player.isTurn ? `0 0 16px ${c.glow}` : 'none',
        backdropFilter: 'blur(6px)',
        minWidth: compact ? 120 : 148,
      }}
    >
      {/* avatar with turn ring */}
      <div className="relative shrink-0">
        <motion.div
          className="grid place-items-center rounded-full text-xl"
          style={{
            width: compact ? 34 : 42,
            height: compact ? 34 : 42,
            background: `radial-gradient(circle at 30% 30%, ${c.light}, ${c.main})`,
            border: `2.5px solid ${player.isTurn ? '#fff' : c.dark}`,
            boxShadow: player.isTurn ? `0 0 12px ${c.glow}` : '0 2px 6px rgba(0,0,0,0.4)',
          }}
          animate={player.isTurn ? { scale: [1, 1.07, 1] } : { scale: 1 }}
          transition={{ repeat: player.isTurn ? Infinity : 0, duration: 1.4 }}
        >
          <span>{player.avatar}</span>
        </motion.div>
        {/* timer ring */}
        {player.isTurn && remainingSec !== null && (
          <svg className="absolute -inset-1.5" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="20" cy="20" r="17.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.6" />
            <circle
              cx="20"
              cy="20"
              r="17.5"
              fill="none"
              stroke={timerPct < 0.3 ? '#ef4444' : '#facc15'}
              strokeWidth="2.6"
              strokeDasharray={`${timerPct * 110} 110`}
              strokeLinecap="round"
            />
          </svg>
        )}
        {player.isBot && (
          <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-800 px-1 text-[8px] font-bold text-slate-300 ring-1 ring-slate-500">
            BOT
          </span>
        )}
        {player.connected === false && (
          <span className="absolute -bottom-1 -right-1 rounded-full bg-red-600 px-1 text-[8px] font-bold text-white">
            OFF
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className={`truncate text-sm font-bold ${compact ? 'text-xs' : ''}`} style={{ color: player.isTurn ? c.light : '#e2e8f0' }}>
            {player.name}
          </span>
          {/* token progress dots */}
          <span className="flex gap-0.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={i}
                className="rounded-full"
                style={{
                  width: 5,
                  height: 5,
                  background: i < player.tokensFinished ? '#22c55e' : i < player.tokensFinished + player.tokensHome ? '#facc15' : '#475569',
                }}
              />
            ))}
          </span>
        </div>
        <span className="text-[10px] text-slate-400">{player.captured} captures</span>
      </div>

      {/* emote bubble */}
      <AnimatePresence>
        {emote && (
          <motion.div
            key={emote.id}
            initial={{ opacity: 0, y: 10, scale: 0.4 }}
            animate={{ opacity: 1, y: -34, scale: 1.2 }}
            exit={{ opacity: 0, y: -52, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 17 }}
            className="absolute -top-2 left-1/2 z-40 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-white shadow-xl ring-2 ring-slate-200"
          >
            <span className="text-lg leading-none">{emote.emoji}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
