'use client'

// Player plaque - Ludo Star style: gold-framed avatar on a wooden plate

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
      className={`relative flex items-center gap-2.5 rounded-2xl px-3 ${compact ? 'py-1.5' : 'py-2'} transition-all duration-300`}
      style={{
        background: player.isTurn
          ? 'linear-gradient(180deg, #7a4c22, #553114)'
          : 'linear-gradient(180deg, #5d3a1c, #462a12)',
        border: `2.5px solid ${player.isTurn ? '#ffd977' : '#9a7038'}`,
        boxShadow: player.isTurn
          ? '0 0 18px rgba(255,205,95,0.55), 0 6px 14px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,225,170,0.3)'
          : '0 6px 14px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,225,170,0.18)',
        minWidth: compact ? 116 : 148,
      }}
    >
      {/* avatar with turn ring */}
      <div className="relative shrink-0">
        <motion.div
          className="grid place-items-center rounded-full"
          style={{
            width: compact ? 34 : 42,
            height: compact ? 34 : 42,
            fontSize: compact ? 18 : 22,
            background: `radial-gradient(circle at 30% 30%, ${c.light}, ${c.main} 70%, ${c.dark})`,
            border: `2.5px solid ${player.isTurn ? '#fff' : 'rgba(255,255,255,0.65)'}`,
            boxShadow: player.isTurn ? `0 0 14px ${c.glow}` : '0 2px 6px rgba(0,0,0,0.45)',
          }}
          animate={player.isTurn ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ repeat: player.isTurn ? Infinity : 0, duration: 1.4 }}
        >
          <span>{player.avatar}</span>
        </motion.div>
        {/* timer ring */}
        {player.isTurn && remainingSec !== null && (
          <svg className="absolute -inset-1.5" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="20" cy="20" r="17.5" fill="none" stroke="rgba(255,217,119,0.25)" strokeWidth="2.6" />
            <circle
              cx="20"
              cy="20"
              r="17.5"
              fill="none"
              stroke={timerPct < 0.3 ? '#ef4444' : '#ffd23e'}
              strokeWidth="2.6"
              strokeDasharray={`${timerPct * 110} 110`}
              strokeLinecap="round"
            />
          </svg>
        )}
        {player.isBot && (
          <span className="absolute -bottom-1 -right-1 rounded-full bg-[#3a2210] px-1 text-[8px] font-bold text-amber-200 ring-1 ring-amber-500/60">
            BOT
          </span>
        )}
        {player.connected === false && (
          <span className="absolute -bottom-1 -right-1 rounded-full bg-red-600 px-1 text-[8px] font-bold text-white ring-1 ring-red-300">
            OFF
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span
            className={`ls-name-shadow truncate font-extrabold ${compact ? 'text-xs' : 'text-sm'}`}
            style={{ color: player.isTurn ? '#ffe9c0' : '#e8d4b4' }}
          >
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
                  background:
                    i < player.tokensFinished
                      ? '#5dd45f'
                      : i < player.tokensFinished + player.tokensHome
                        ? '#ffd23e'
                        : '#7c5c33',
                  boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.4)',
                }}
              />
            ))}
          </span>
        </div>
        <span className="text-[10px] text-amber-200/60">{player.captured} captures</span>
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
            className="absolute -top-2 left-1/2 z-40 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-white shadow-xl ring-2 ring-amber-200"
          >
            <span className="text-lg leading-none">{emote.emoji}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
