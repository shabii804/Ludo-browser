'use client'

// Win / game-over overlay with confetti + rematch

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Home, RotateCcw } from 'lucide-react'
import type { WinData } from '@/stores/ludoStore'
import { COLOR_HEX } from '@/lib/ludo/board'
import { useLudo } from '@/stores/ludoStore'

const CONFETTI_COLORS = ['#fbbf24', '#ef4444', '#22c55e', '#3b82f6', '#f472b6', '#a855f7']

function Confetti({ n = 60 }: { n?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 2.4 + Math.random() * 2,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rot: Math.random() * 360,
      })),
    [n]
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -30, x: `${p.x}vw`, opacity: 1, rotate: p.rot }}
          animate={{ y: '105vh', rotate: p.rot + 540, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 block"
          style={{ left: `${p.x}%`, width: p.size, height: p.size * 0.5, background: p.color, borderRadius: 2 }}
        />
      ))}
    </div>
  )
}

export default function WinOverlay({ win, isOnline }: { win: WinData; isOnline: boolean }) {
  const localRematch = useLudo((s) => s.localRematch)
  const onlineRematch = useLudo((s) => s.onlineRematch)
  const rematchVotes = useLudo((s) => s.rematchVotes)
  const leaveGame = useLudo((s) => s.leaveGame)
  const c = COLOR_HEX[win.winner]

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/80" style={{ backdropFilter: 'blur(6px)' }}>
      {win.youWon && <Confetti />}
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="relative mx-4 w-full max-w-sm rounded-3xl p-6 text-center"
        style={{
          background: 'linear-gradient(160deg, rgba(30,41,59,0.98), rgba(15,23,42,0.98))',
          border: `2px solid ${c.main}`,
          boxShadow: `0 0 60px ${c.glow}`,
        }}
      >
        <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full text-4xl"
          style={{
            background: `radial-gradient(circle at 32% 28%, ${c.light}, ${c.main}, ${c.dark})`,
            boxShadow: `0 6px 22px ${c.glow}`,
          }}
        >
          🏆
        </div>
        <h2 className="text-2xl font-black text-white">{win.youWon ? 'You Win!' : `${win.winnerName} Wins!`}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {win.winnerName} finished all tokens first
        </p>
        <div className="mx-auto mt-4 w-fit rounded-2xl px-6 py-3" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)' }}>
          <span className="text-xs text-amber-200/80">WINNER POT</span>
          <div className="text-3xl font-black text-amber-400">+{win.pot.toLocaleString()}</div>
          <span className="text-[11px] text-slate-400">
            {win.youWon ? 'coins added to your wallet' : `${win.winnerName} takes the pot`}
          </span>
        </div>

        <div className="mt-5 flex gap-2.5">
          {isOnline ? (
            <button
              onClick={onlineRematch}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-slate-900 transition hover:brightness-110"
              style={{ background: 'linear-gradient(160deg,#fbbf24,#f59e0b)' }}
            >
              <RotateCcw size={16} /> Rematch ({rematchVotes.length})
            </button>
          ) : (
            <button
              onClick={localRematch}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-slate-900 transition hover:brightness-110"
              style={{ background: 'linear-gradient(160deg,#fbbf24,#f59e0b)' }}
            >
              <RotateCcw size={16} /> Play Again
            </button>
          )}
          <button
            onClick={leaveGame}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-slate-200 ring-1 ring-slate-500 transition hover:bg-slate-800"
            style={{ background: 'rgba(30,41,59,0.8)' }}
          >
            <Home size={16} /> Menu
          </button>
        </div>
      </motion.div>
    </div>
  )
}
