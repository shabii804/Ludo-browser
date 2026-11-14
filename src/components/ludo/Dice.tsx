'use client'

// Glossy Ludo Star style dice with roll animation

import { motion } from 'framer-motion'
import type { Color } from '@/lib/ludo/types'
import { COLOR_HEX } from '@/lib/ludo/board'

const PIP: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
}

export function Die({
  value,
  color,
  rolling,
  used,
  selected,
  onClick,
  size = 64,
}: {
  value: number
  color: Color
  rolling: boolean
  used: boolean
  selected?: boolean
  onClick?: () => void
  size?: number
}) {
  const c = COLOR_HEX[color]
  return (
    <motion.button
      onClick={onClick}
      disabled={!onClick}
      animate={
        rolling
          ? { rotate: [0, 90, 180, 270, 360, 450], scale: [1, 1.12, 0.95, 1.08, 1, 1] }
          : selected
            ? { scale: 1.1 }
            : { scale: 1 }
      }
      transition={rolling ? { duration: 0.65, ease: 'easeInOut' } : { type: 'spring', stiffness: 300, damping: 16 }}
      className="relative rounded-2xl"
      style={{
        width: size,
        height: size,
        background: used
          ? 'linear-gradient(145deg,#475569,#334155)'
          : `linear-gradient(145deg, #ffffff, ${c.light})`,
        border: `3px solid ${used ? '#334155' : selected ? c.main : '#e2e8f0'}`,
        boxShadow: used
          ? 'inset 0 2px 6px rgba(0,0,0,0.4)'
          : `0 6px 14px rgba(0,0,0,0.4), 0 0 12px ${selected ? c.glow : 'transparent'}, inset 0 -4px 8px rgba(0,0,0,0.08)`,
        opacity: used ? 0.45 : 1,
      }}
      aria-label={`Dice showing ${value}${used ? ' (used)' : ''}`}
    >
      {rolling ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className="w-2/5 h-2/5 rounded-full" style={{ background: c.main, filter: 'blur(2px)', opacity: 0.7 }} />
        </div>
      ) : (
        <>
          {(PIP[value] ?? PIP[1]).map(([x, y], i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: '19%',
                height: '19%',
                transform: 'translate(-50%,-50%)',
                background: used ? '#94a3b8' : '#1e293b',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
              }}
            />
          ))}
        </>
      )}
    </motion.button>
  )
}

export default function DiceTray({
  values,
  color,
  rolling,
  usedDice,
  selectedDie,
  onSelectDie,
  onRoll,
  canRoll,
  playerName,
  isYou,
}: {
  values: number[]
  color: Color
  rolling: boolean
  usedDice: number[]
  selectedDie: number
  onSelectDie?: (i: number) => void
  onRoll?: () => void
  canRoll: boolean
  playerName: string
  isYou: boolean
}) {
  const c = COLOR_HEX[color]
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`flex items-center gap-3 rounded-3xl px-5 py-3 transition-shadow ${canRoll ? 'cursor-pointer' : ''}`}
        style={{
          background: 'rgba(15,23,42,0.72)',
          border: `2px solid ${canRoll ? c.main : 'rgba(71,85,105,0.5)'}`,
          boxShadow: canRoll ? `0 0 22px ${c.glow}` : '0 4px 12px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(6px)',
        }}
        onClick={canRoll ? onRoll : undefined}
        role="button"
        aria-disabled={!canRoll}
        aria-label={canRoll ? 'Roll dice' : `Waiting for ${playerName}`}
      >
        {values.length === 0 && !rolling ? (
          <div className="flex flex-col items-center px-1">
            <span className="text-xs font-semibold" style={{ color: c.light }}>
              {isYou ? 'Your turn' : playerName}
            </span>
            <span className="text-[11px] text-slate-400">{isYou ? 'Tap to roll' : 'rolling...'}</span>
          </div>
        ) : (
          values.map((v, i) => (
            <Die
              key={i}
              value={v}
              color={color}
              rolling={rolling}
              used={usedDice.includes(i)}
              selected={!rolling && !usedDice.includes(i) && i === selectedDie && values.length > 1}
              onClick={
                !rolling && !usedDice.includes(i) && values.length > 1 && onSelectDie
                  ? () => onSelectDie(i)
                  : undefined
              }
            />
          ))
        )}
        {canRoll && values.length === 0 && (
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.1 }}
            className="text-2xl"
            style={{ color: c.main }}
          >
            🎲
          </motion.span>
        )}
      </div>
    </div>
  )
}
