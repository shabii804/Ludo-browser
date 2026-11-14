'use client'

// Ludo Star - root app: menu <-> game

import { useEffect } from 'react'
import { useLudo } from '@/stores/ludoStore'
import MenuScreen from '@/components/ludo/MenuScreen'
import GameScreen from '@/components/ludo/GameScreen'

export default function LudoApp() {
  const view = useLudo((s) => s.view)
  const hydrate = useLudo((s) => s.hydrate)

  useEffect(() => {
    hydrate()
    ;(window as unknown as { __LUDO__: typeof useLudo }).__LUDO__ = useLudo
  }, [hydrate])

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,#1e293b_0%,#0f172a_45%,#020617_100%)] text-slate-100">
      {view === 'menu' ? <MenuScreen /> : <GameScreen />}
    </main>
  )
}
