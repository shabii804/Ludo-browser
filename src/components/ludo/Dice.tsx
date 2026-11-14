'use client'

// ============================================================
// Premium 3D dice: glossy ivory faces, inset pips, tumbling
// roll animation, rendered in the CENTER of the board,
// tap to roll. API unchanged.
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

export interface DiceCenterProps {
  values: number[]
  color: Color
  rolling: boolean
  canRoll: boolean
  isYou: boolean
  playerName: string
  usedDice: number[]
  selectedDie: number
  onSelectDie?: (i: number) => void
  onRoll?: () => void
}

export default function DiceCenter({
  values,
  color,
  rolling,
  canRoll,
  isYou,
  playerName,
  usedDice,
  selectedDie,
  onSelectDie,
  onRoll,
}: DiceCenterProps) {
  const c = COLOR_HEX[color]
  const showTap = canRoll && values.length === 0 && !rolling
  const twoDice = values.length > 1

  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{ left: '39.5%', top: '39.5%', width: '21%', height: '21%' }}
      aria-label={showTap ? 'Roll dice' : undefined}
    >
      {/* soft plate shadow under the dice */}
      <div
        className="absolute inset-[4%] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(10,14,40,0.28), transparent 68%)' }}
      />

      {rolling ? (
        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            className="h-[80%] w-[80%]"
            animate={{
              rotateX: [0, 180, 360, 540, 720],
              rotateY: [0, 120, 240, 480, 600],
              rotate: [0, 40, 0, -30, 0],
              scale: [1, 1.16, 0.94, 1.1, 1],
              x: [0, -6, 6, -3, 0],
              y: [0, 3, -4, 2, 0],
            }}
            transition={{ repeat: Infinity, duration: 0.62, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d', perspective: 400 }}
          >
            <DieFace value={3} />
          </motion.div>
        </div>
      ) : twoDice ? (
        /* Master mode: two dice side by side */
        <div className="absolute inset-0 flex items-center justify-center gap-[7%] px-[4%]">
          {values.map((v, i) => (
            <motion.button
              key={i}
              className={`pointer-events-auto relative aspect-square h-auto w-[40%] ${
                !rolling && !usedDice.includes(i) && onSelectDie ? 'cursor-pointer' : ''
              }`}
              onClick={!rolling && !usedDice.includes(i) && onSelectDie ? () => onSelectDie(i) : undefined}
              animate={
                !rolling && !usedDice.includes(i) && selectedDie === i
                  ? { y: -7, scale: 1.14 }
                  : { y: 0, scale: 1 }
              }
              transition={{ type: 'spring', stiffness: 320, damping: 15 }}
              aria-label={`Die ${i + 1} showing ${v}${usedDice.includes(i) ? ' (used)' : ''}`}
            >
              <DieFace value={v} used={usedDice.includes(i)} />
              {!rolling && !usedDice.includes(i) && selectedDie === i && (
                <span
                  className="absolute -inset-[16%] rounded-[30%] border-[3px] border-white/90"
                  style={{ boxShadow: `0 0 14px ${c.glow}` }}
                />
              )}
            </motion.button>
          ))}
        </div>
      ) : (
        /* single die: tap-to-roll or last value */
        <div className="absolute inset-0 grid place-items-center">
          <motion.button
            className={`relative h-[80%] w-[80%] ${showTap ? 'pointer-events-auto cursor-pointer' : ''}`}
            onClick={showTap ? onRoll : undefined}
            animate={
              showTap
                ? { scale: [1, 1.12, 1] }
                : { scale: 1, opacity: values.length === 0 ? 0.55 : 1 }
            }
            transition={
              showTap
                ? { repeat: Infinity, duration: 0.9, ease: 'easeInOut' }
                : { duration: 0.2 }
            }
            whileTap={showTap ? { scale: 0.88 } : undefined}
            role={showTap ? 'button' : undefined}
            aria-disabled={!showTap}
            aria-label={
              showTap
                ? 'Roll dice'
                : values.length > 0
                  ? `Dice showing ${values[0]}`
                  : `Waiting for ${playerName}`
            }
          >
            <DieFace value={values[0] ?? 6} used={usedDice.includes(0)} />
            {showTap && (
              <motion.span
                className="ls-font absolute -top-7 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-sm leading-tight text-white"
                style={{
                  background: 'linear-gradient(180deg,#ffe08a,#f0a10c)',
                  border: '2px solid #fff3c9',
                  textShadow: '0 1px 0 rgba(120,60,0,0.65)',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.45)',
                }}
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
              >
                TAP
              </motion.span>
            )}
            {showTap && isYou && (
              <span
                className="absolute -inset-[22%] rounded-[32%]"
                style={{ boxShadow: `0 0 22px 4px ${c.glow}` }}
              />
            )}
          </motion.button>
        </div>
      )}
    </div>
  )
}
