'use client'

// ============================================================
// Dice — shared glossy die face + CornerDiceSlot.
// The dice lives in the CORNER of the player whose turn it is
// (Ludo Star style): a compact holder anchored to that player's
// yard, tap to roll. Master mode shows two mini dice.
// ============================================================

import { motion } from 'framer-motion'
import type { Color } from '@/lib/ludo/types'
import { COLOR_HEX } from '@/lib/ludo/board'

const PIP: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[27, 27], [73, 73]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[27, 27], [73, 27], [27, 73], [73, 73]],
  5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[27, 24], [73, 24], [27, 50], [73, 50], [27, 76], [73, 76]],
}

export function DieFace({
  value,
  used = false,
  className = '',
  style,
}: {
  value: number
  used?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`relative h-full w-full rounded-[24%] ${className}`}
      style={{
        ...style,
        background: used
          ? 'linear-gradient(145deg,#9aa5c0,#6e7ca0)'
          : 'linear-gradient(150deg,#ffffff 18%,#eceffb 88%)',
        border: '2px solid #b9c0e8',
        boxShadow: used
          ? 'inset 0 3px 10px rgba(20,25,60,0.45)'
          : '0 5px 12px rgba(10,14,40,0.5), inset 0 -4px 8px rgba(90,100,160,0.22), inset 0 2px 0 rgba(255,255,255,0.95)',
        opacity: used ? 0.45 : 1,
      }}
    >
      {(PIP[value] ?? PIP[1]).map(([x, y], i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: '21%',
            height: '21%',
            transform: 'translate(-50%,-50%)',
            background: used ? '#8fa0b5' : 'radial-gradient(circle at 35% 30%, #3d4766, #141a33 70%)',
            boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.5)',
          }}
        />
      ))}
    </div>
  )
}

/** inner-corner anchor of each yard, in board cell units (top-left of the dice plate) */
const DICE_ANCHOR: Record<Color, { c: number; r: number }> = {
  red: { c: 4.7, r: 4.7 },
  green: { c: 8.4, r: 4.7 },
  yellow: { c: 8.4, r: 8.4 },
  blue: { c: 4.7, r: 8.4 },
}

export interface DiceSlotProps {
  color: Color
  values: number[]
  rolling: boolean
  canRoll: boolean
  isYou: boolean
  usedDice: number[]
  selectedDie: number
  onSelectDie?: (i: number) => void
  onRoll?: () => void
  /** plate size in board cells (default 1.9) */
  size?: number
}

/**
 * Dice holder rendered at the active player's yard corner.
 * Idle state (not this player's turn) renders nothing.
 */
export function DiceSlot({
  color,
  values,
  rolling,
  canRoll,
  isYou,
  usedDice,
  selectedDie,
  onSelectDie,
  onRoll,
  size = 1.9,
}: DiceSlotProps) {
  const c = COLOR_HEX[color]
  const anchor = DICE_ANCHOR[color]
  const showTap = canRoll && values.length === 0 && !rolling
  const twoDice = values.length > 1
  const pctUnit = (v: number) => `${(v / 15) * 100}%`

  return (
    <div
      className="absolute z-30"
      style={{ left: pctUnit(anchor.c), top: pctUnit(anchor.r), width: pctUnit(size), height: pctUnit(size) }}
    >
      {/* holder plate */}
      <div
        className="absolute inset-0 rounded-[22%]"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.22), rgba(10,14,40,0.30))',
          border: `1.5px solid ${c.main}`,
          boxShadow: showTap ? `0 0 14px 2px ${c.glow}` : '0 4px 10px rgba(10,14,40,0.35)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {rolling ? (
        <div className="absolute inset-[10%] grid place-items-center">
          <motion.div
            className="h-full w-full"
            animate={{
              rotateX: [0, 180, 360, 540, 720],
              rotateY: [0, 120, 240, 480, 600],
              rotate: [0, 40, 0, -30, 0],
              scale: [1, 1.16, 0.94, 1.1, 1],
            }}
            transition={{ repeat: Infinity, duration: 0.62, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d', perspective: 400 }}
          >
            <DieFace value={3} />
          </motion.div>
        </div>
      ) : twoDice ? (
        <div className="absolute inset-[8%] flex items-center justify-center gap-[6%]">
          {values.map((v, i) => (
            <motion.button
              key={i}
              className={`relative aspect-square w-[44%] ${!usedDice.includes(i) && onSelectDie ? 'cursor-pointer' : ''}`}
              onClick={!usedDice.includes(i) && onSelectDie ? () => onSelectDie(i) : undefined}
              animate={!usedDice.includes(i) && selectedDie === i ? { y: -4, scale: 1.12 } : { y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 15 }}
              aria-label={`Die ${i + 1} showing ${v}${usedDice.includes(i) ? ' (used)' : ''}`}
            >
              <DieFace value={v} used={usedDice.includes(i)} />
              {!usedDice.includes(i) && selectedDie === i && (
                <span className="absolute -inset-[18%] rounded-[30%] border-[2.5px] border-white/90" />
              )}
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="absolute inset-[10%] grid place-items-center">
          <motion.button
            className={`relative h-full w-full ${showTap ? 'cursor-pointer' : ''}`}
            onClick={showTap ? onRoll : undefined}
            animate={
              showTap
                ? { scale: [1, 1.1, 1] }
                : { scale: 1, opacity: values.length === 0 ? 0.5 : 1 }
            }
            transition={showTap ? { repeat: Infinity, duration: 0.9, ease: 'easeInOut' } : { duration: 0.2 }}
            whileTap={showTap ? { scale: 0.85 } : undefined}
            role={showTap ? 'button' : undefined}
            aria-disabled={!showTap}
            aria-label={showTap ? 'Roll dice' : values.length > 0 ? `Dice showing ${values[0]}` : undefined}
          >
            <DieFace value={values[0] ?? 6} used={usedDice.includes(0)} />
            {showTap && isYou && (
              <motion.span
                className="ls-font absolute -top-[34%] left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[11px] leading-tight text-white"
                style={{
                  background: 'linear-gradient(180deg,#ffe08a,#f0a10c)',
                  border: '2px solid #fff3c9',
                  textShadow: '0 1px 0 rgba(120,60,0,0.65)',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.45)',
                }}
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
              >
                TAP
              </motion.span>
            )}
          </motion.button>
        </div>
      )}
    </div>
  )
}
