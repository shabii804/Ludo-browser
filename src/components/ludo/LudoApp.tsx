'use client'

// Ludo Royale — root app: lobby <-> waiting room <-> game,
// with smooth page transitions between views.

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLudo } from '@/stores/ludoStore'
import MenuScreen from '@/components/ludo/MenuScreen'
import WaitingRoom from '@/components/ludo/WaitingRoom'
import GameScreen from '@/components/ludo/GameScreen'

const VIEWS: Record<string, React.ComponentType> = {
  menu: MenuScreen,
  lobby: WaitingRoom,
  game: GameScreen,
}

export default function LudoApp() {
  const view = useLudo((s) => s.view)
  const hydrate = useLudo((s) => s.hydrate)

  useEffect(() => {
    hydrate()
    ;(window as unknown as { __LUDO__: typeof useLudo }).__LUDO__ = useLudo
  }, [hydrate])

  const Active = VIEWS[view] ?? MenuScreen

  return (
    <main className="ls-bg min-h-screen text-indigo-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.985 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Active />
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
