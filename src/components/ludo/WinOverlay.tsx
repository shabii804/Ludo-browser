'use client'

// Win / game-over overlay - Ludo Star style: golden WINNER banner,
// spinning rays, trophy, pot payout, carved buttons.

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Home, RotateCcw } from 'lucide-react'
import type { WinData } from '@/stores/ludoStore'
import { COLOR_HEX } from '@/lib/ludo/board'
import { useLudo } from '@/stores/ludoStore'

const CONFETTI_COLORS = ['#ffd23e', '#e5453c', '#46a848', '#2a8ee0', '#ff8fab', '#a855f7']

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
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70" style={{ backdropFilter: 'blur(5px)' }}>
      {win.youWon && <Confetti />}
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl p-6 text-center"
        style={{
          background: 'linear-gradient(170deg, #7a4c22 0%, #5d3a1c 55%, #462a12 100%)',
          border: '4px solid #f3d9a4',
          boxShadow: `0 0 60px ${c.glow}, 0 24px 50px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,230,180,0.35)`,
        }}
      >
        {/* spinning rays behind trophy */}
        {win.youWon && (
          <motion.span
            className="pointer-events-none absolute left-1/2 top-10 h-56 w-56 -translate-x-1/2 rounded-full"
            style={{
              background: 'repeating-conic-gradient(rgba(255,214,90,0.30) 0deg 11deg, transparent 11deg 26deg)',
              maskImage: 'radial-gradient(circle, black 0%, transparent 68%)',
              WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 68%)',
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
          />
        )}

        <div
          className="relative mx-auto mb-3 grid h-24 w-24 place-items-center rounded-full text-5xl"
          style={{
            background: `radial-gradient(circle at 32% 28%, ${c.light}, ${c.main} 60%, ${c.dark})`,
            border: '3px solid #f3d9a4',
            boxShadow: `0 8px 26px ${c.glow}, inset 0 2px 6px rgba(255,255,255,0.35)`,
          }}
        >
          🏆
        </div>

        <h2 className="ls-font text-4xl leading-none" style={{ color: win.youWon ? '#ffd23e' : '#fff3d6', textShadow: '0 3px 0 rgba(70,30,5,0.7), 0 6px 14px rgba(0,0,0,0.5)' }}>
          {win.youWon ? 'WINNER!' : `${win.winnerName.toUpperCase()} WINS!`}
        </h2>
        <p className="ls-name-shadow mt-1.5 text-sm text-amber-100/80">
          {win.winnerName} finished all tokens first
        </p>

        <div
          className="ls-chip mx-auto mt-4 w-fit rounded-2xl px-6 py-3"
          style={{ borderColor: 'rgba(255,210,90,0.6)' }}
        >
          <span className="ls-font text-xs tracking-wider text-amber-200/80">WINNER POT</span>
          <div className="ls-font text-4xl leading-tight text-amber-300" style={{ textShadow: '0 2px 0 rgba(70,30,5,0.6)' }}>
            +{win.pot.toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-100/60">
            {win.youWon ? 'coins added to your wallet' : `${win.winnerName} takes the pot`}
          </span>
        </div>

        <div className="mt-5 flex gap-2.5">
          {isOnline ? (
            <button
              onClick={onlineRematch}
              className="ls-btn ls-btn-green ls-font flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm text-white"
            >
              <RotateCcw size={16} /> REMATCH ({rematchVotes.length})
            </button>
          ) : (
            <button
              onClick={localRematch}
              className="ls-btn ls-btn-green ls-font flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm text-white"
            >
              <RotateCcw size={16} /> PLAY AGAIN
            </button>
          )}
          <button
            onClick={leaveGame}
            className="ls-btn ls-font flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm text-white"
          >
            <Home size={16} /> MENU
          </button>
        </div>
      </motion.div>
    </div>
  )
}
