'use client'

// Main menu - Ludo Star style: logo, profile, game modes, stakes, online lobby

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Globe, Loader2, Plus, Users, Wifi, WifiOff } from 'lucide-react'
import { useLudo } from '@/stores/ludoStore'
import { AVATARS, FREE_REFILL, MODE_DESC, MODE_LABELS, STAKES } from '@/lib/ludo/constants'
import type { GameMode } from '@/lib/ludo/types'

function CoinChip({ coins, onRefill }: { coins: number; onRefill: () => void }) {
  return (
    <button
      onClick={onRefill}
      className="flex items-center gap-1.5 rounded-full bg-slate-900/70 px-4 py-2 ring-1 ring-amber-500/60 transition hover:bg-slate-800"
      title="Tap for free refill"
    >
      <span className="text-base">🪙</span>
      <span className="text-sm font-black text-amber-400">{coins.toLocaleString()}</span>
      <Plus size={14} className="text-amber-300" />
    </button>
  )
}

function ModePill({ mode, value, onChange }: { mode: GameMode; value: GameMode; onChange: (m: GameMode) => void }) {
  const active = mode === value
  return (
    <button
      onClick={() => onChange(mode)}
      className={`flex-1 rounded-xl px-2 py-2 text-center transition ${active ? 'shadow-lg' : 'hover:bg-slate-800/70'}`}
      style={{
        background: active ? 'linear-gradient(150deg,#f59e0b,#d97706)' : 'rgba(30,41,59,0.7)',
        border: `1px solid ${active ? '#fbbf24' : 'rgba(71,85,105,0.6)'}`,
      }}
    >
      <div className={`text-xs font-black ${active ? 'text-slate-900' : 'text-slate-200'}`}>{MODE_LABELS[mode]}</div>
      <div className={`mt-0.5 text-[9px] leading-tight ${active ? 'text-amber-950' : 'text-slate-400'}`}>{MODE_DESC[mode]}</div>
    </button>
  )
}

function StakePicker({ stake, onChange, coins }: { stake: number; onChange: (n: number) => void; coins: number }) {
  return (
    <div className="flex gap-2">
      {STAKES.map((s) => {
        const active = stake === s
        const afford = coins >= s
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            disabled={!afford}
            className={`flex-1 rounded-xl px-2 py-2.5 text-center transition ${active ? 'shadow-lg' : ''} ${afford ? 'hover:bg-slate-800/70' : 'opacity-35'}`}
            style={{
              background: active ? 'linear-gradient(150deg,#22c55e,#15803d)' : 'rgba(30,41,59,0.7)',
              border: `1px solid ${active ? '#4ade80' : 'rgba(71,85,105,0.6)'}`,
            }}
          >
            <div className={`text-sm font-black ${active ? 'text-slate-900' : 'text-amber-300'}`}>🪙 {s.toLocaleString()}</div>
            <div className={`text-[9px] ${active ? 'text-green-950' : 'text-slate-400'}`}>entry</div>
          </button>
        )
      })}
    </div>
  )
}

export default function MenuScreen() {
  const profile = useLudo((s) => s.profile)
  const hydrated = useLudo((s) => s.hydrated)
  const updateProfile = useLudo((s) => s.updateProfile)
  const addCoins = useLudo((s) => s.addCoins)
  const refillCoins = useLudo((s) => s.refillCoins)
  const menuTab = useLudo((s) => s.menuTab)
  const setMenuTab = useLudo((s) => s.setMenuTab)
  const startLocalGame = useLudo((s) => s.startLocalGame)
  const onlineConnect = useLudo((s) => s.onlineConnect)
  const onlineStatus = useLudo((s) => s.onlineStatus)
  const onlineError = useLudo((s) => s.onlineError)
  const lobby = useLudo((s) => s.lobby)
  const onlineCreate = useLudo((s) => s.onlineCreate)
  const onlineJoin = useLudo((s) => s.onlineJoin)
  const onlineQuick = useLudo((s) => s.onlineQuick)
  const onlineAddBot = useLudo((s) => s.onlineAddBot)
  const onlineStart = useLudo((s) => s.onlineStart)
  const onlineLeave = useLudo((s) => s.onlineLeave)

  const [mode, setMode] = useState<GameMode>('classic')
  const [stake, setStake] = useState<number>(100)
  const [botCount, setBotCount] = useState(1)
  const [passCount, setPassCount] = useState(2)
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)

  // connect socket when entering online tab
  useEffect(() => {
    if (menuTab === 'online') onlineConnect()
  }, [menuTab, onlineConnect])

  const canPlay = profile.coins >= stake

  function playVsComputer() {
    if (!canPlay) return
    const botAvatars = AVATARS.filter((a) => a !== profile.avatar)
    const players = [{ name: profile.name, avatar: profile.avatar, isBot: false }]
    const botNames = ['Rocky', 'Zuby', 'Lola', 'Kiki']
    for (let i = 0; i < botCount; i++) {
      players.push({ name: botNames[i], avatar: botAvatars[(i * 5) % botAvatars.length], isBot: true })
    }
    startLocalGame({ mode, stake, players })
  }

  function playPass() {
    if (!canPlay) return
    const names = ['Player 1', 'Player 2', 'Player 3', 'Player 4']
    const players = Array.from({ length: passCount }, (_, i) => ({
      name: i === 0 ? profile.name : names[i],
      avatar: i === 0 ? profile.avatar : AVATARS[(i * 4 + 2) % AVATARS.length],
      isBot: false,
    }))
    startLocalGame({ mode, stake, players })
  }

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-4 pb-10 pt-8">
      {/* logo */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="grid h-11 w-11 rotate-12 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-600 text-2xl shadow-[0_6px_18px_rgba(251,191,36,0.45)]">
            🎲
          </span>
          <h1 className="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-4xl font-black tracking-tight text-transparent drop-shadow-[0_2px_0_rgba(120,53,15,0.45)]">
            LUDO STAR
          </h1>
        </div>
        <p className="mt-1 text-[11px] font-semibold tracking-[0.3em] text-slate-400">PLAY WITH EVERYONE</p>
      </motion.div>

      {/* profile card */}
      <div className="mt-4 w-full rounded-2xl bg-slate-900/70 p-3.5 ring-1 ring-slate-600" style={{ backdropFilter: 'blur(6px)' }}>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-900 to-slate-800 text-2xl ring-2 ring-amber-400/70">
            {profile.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <input
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value.slice(0, 14) })}
              className="w-full rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              aria-label="Your name"
              maxLength={14}
            />
            <div className="mt-1 flex gap-3 text-[10px] text-slate-400">
              <span className="text-emerald-400">{profile.wins}W</span>
              <span className="text-red-400">{profile.losses}L</span>
            </div>
          </div>
          <CoinChip coins={profile.coins} onRefill={refillCoins} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => updateProfile({ avatar: a })}
              className={`grid h-8 w-8 place-items-center rounded-full text-lg transition ${profile.avatar === a ? 'scale-110 bg-amber-500/25 ring-2 ring-amber-400' : 'bg-slate-800 hover:bg-slate-700'}`}
              aria-label={`Choose avatar ${a}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* mode tabs */}
      <div className="mt-4 grid w-full grid-cols-3 gap-1.5 rounded-2xl bg-slate-900/70 p-1.5 ring-1 ring-slate-600">
        {([
          ['computer', 'vs Computer', <Bot key="b" size={15} />],
          ['pass', 'Pass & Play', <Users key="u" size={15} />],
          ['online', 'Online', <Globe key="g" size={15} />],
        ] as Array<[typeof menuTab, string, React.ReactNode]>).map(([tab, label, icon]) => (
          <button
            key={tab}
            onClick={() => setMenuTab(tab)}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition ${menuTab === tab ? 'shadow-lg' : 'hover:bg-slate-800'}`}
            style={{
              background: menuTab === tab ? 'linear-gradient(150deg,#fbbf24,#f59e0b)' : 'transparent',
              color: menuTab === tab ? '#1e1b04' : '#cbd5e1',
            }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={menuTab + (lobby?.code ?? '')}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.18 }}
          className="w-full"
        >
          {/* game rules variant */}
          <div className="mt-4 w-full">
            <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-400">GAME MODE</p>
            <div className="flex gap-2">
              {(['classic', 'quick', 'master'] as GameMode[]).map((m) => (
                <ModePill key={m} mode={m} value={mode} onChange={setMode} />
              ))}
            </div>
          </div>

          <div className="mt-3 w-full">
            <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-400">TABLE STAKE (winner takes pot)</p>
            <StakePicker stake={stake} onChange={setStake} coins={profile.coins} />
          </div>

          {menuTab === 'computer' && (
            <div className="mt-4 w-full rounded-2xl bg-slate-900/70 p-3.5 ring-1 ring-slate-600">
              <p className="mb-2 text-[10px] font-bold tracking-wider text-slate-400">OPPONENTS</p>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setBotCount(n)}
                    className={`flex-1 rounded-xl px-2 py-2.5 text-xs font-bold transition ${botCount === n ? 'text-slate-900' : 'text-slate-200'}`}
                    style={{
                      background: botCount === n ? 'linear-gradient(150deg,#fbbf24,#f59e0b)' : 'rgba(30,41,59,0.7)',
                      border: '1px solid rgba(71,85,105,0.6)',
                    }}
                  >
                    {n} Bot{n > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {menuTab === 'pass' && (
            <div className="mt-4 w-full rounded-2xl bg-slate-900/70 p-3.5 ring-1 ring-slate-600">
              <p className="mb-2 text-[10px] font-bold tracking-wider text-slate-400">PLAYERS ON THIS DEVICE</p>
              <div className="flex gap-2">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPassCount(n)}
                    className={`flex-1 rounded-xl px-2 py-2.5 text-xs font-bold transition ${passCount === n ? 'text-slate-900' : 'text-slate-200'}`}
                    style={{
                      background: passCount === n ? 'linear-gradient(150deg,#fbbf24,#f59e0b)' : 'rgba(30,41,59,0.7)',
                      border: '1px solid rgba(71,85,105,0.6)',
                    }}
                  >
                    {n} Players
                  </button>
                ))}
              </div>
            </div>
          )}

          {menuTab === 'online' && (
            <div className="mt-4 w-full">
              {onlineStatus === 'idle' || onlineStatus === 'connecting' ? (
                <div className="rounded-2xl bg-slate-900/70 p-3.5 ring-1 ring-slate-600">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Wifi size={14} className="animate-pulse text-amber-400" />
                    {onlineStatus === 'connecting' ? 'Connecting to game server...' : 'Connecting to game server...'}
                  </div>
                  {onlineError && <p className="mt-2 rounded-lg bg-red-900/40 px-2.5 py-1.5 text-[11px] text-red-300">{onlineError}</p>}
                </div>
              ) : lobby ? (
                <div className="rounded-2xl bg-slate-900/70 p-3.5 ring-1 ring-amber-500/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-slate-400">ROOM CODE</p>
                      <p className="text-2xl font-black tracking-[0.2em] text-amber-400">{lobby.code}</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      {lobby.players.length}/{lobby.seats} players
                      <br />
                      {MODE_LABELS[lobby.mode]} · 🪙{lobby.stake}
                    </div>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {lobby.players.map((p, i) => (
                      <div key={p.id + i} className="flex items-center gap-2 rounded-xl bg-slate-800/70 px-2.5 py-1.5">
                        <span className="text-lg">{p.avatar}</span>
                        <span className="flex-1 truncate text-xs font-bold text-slate-200">{p.name}</span>
                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-slate-900" style={{ background: '#fbbf24' }}>
                          {p.color}
                        </span>
                        {p.isBot && <span className="text-[9px] text-slate-400">BOT</span>}
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, lobby.seats - lobby.players.length) }).map((_, i) => (
                      <div key={`empty${i}`} className="flex items-center gap-2 rounded-xl border border-dashed border-slate-600 px-2.5 py-1.5">
                        <span className="text-xs text-slate-500">Waiting for player...</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {lobby.players.length < lobby.seats && lobby.hostId === profile.id && (
                      <button onClick={onlineAddBot} className="flex-1 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-200 ring-1 ring-slate-500 transition hover:bg-slate-700">
                        + Add Bot
                      </button>
                    )}
                    {lobby.hostId === profile.id ? (
                      <button
                        onClick={onlineStart}
                        className="flex-1 rounded-xl py-2.5 text-xs font-black text-slate-900 transition hover:brightness-110"
                        style={{ background: 'linear-gradient(150deg,#4ade80,#16a34a)' }}
                      >
                        Start Game
                      </button>
                    ) : (
                      <div className="flex-1 rounded-xl bg-slate-800 py-2.5 text-center text-xs font-bold text-slate-300">Waiting for host...</div>
                    )}
                    <button onClick={onlineLeave} className="rounded-xl bg-red-900/60 px-3 py-2.5 text-xs font-bold text-red-200 ring-1 ring-red-500/50 transition hover:bg-red-900">
                      Leave
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button
                    onClick={() => {
                      if (!canPlay) return
                      setBusy(true)
                      onlineQuick(stake, mode)
                      setTimeout(() => setBusy(false), 2500)
                    }}
                    disabled={!canPlay || busy}
                    className="w-full rounded-2xl py-4 text-base font-black text-slate-900 shadow-[0_8px_24px_rgba(251,191,36,0.4)] transition hover:brightness-110 disabled:opacity-50"
                    style={{ background: 'linear-gradient(160deg,#fde68a,#f59e0b)' }}
                  >
                    {busy ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Finding players...</span> : '⚡ Quick Match'}
                  </button>
                  <button
                    onClick={() => canPlay && onlineCreate({ stake, mode, seats: 4, botFill: true })}
                    disabled={!canPlay}
                    className="w-full rounded-2xl bg-slate-800/90 py-3 text-sm font-bold text-amber-300 ring-1 ring-amber-500/40 transition hover:bg-slate-700 disabled:opacity-50"
                  >
                    Create Private Room
                  </button>
                  <div className="flex gap-2">
                    <input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                      placeholder="ROOM CODE"
                      className="min-w-0 flex-1 rounded-xl bg-slate-800/90 px-3 py-3 text-center text-sm font-black tracking-[0.25em] text-white placeholder:text-slate-500 placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-amber-400"
                      aria-label="Room code"
                    />
                    <button
                      onClick={() => canPlay && joinCode.length >= 3 && onlineJoin(joinCode, stake, mode)}
                      disabled={!canPlay || joinCode.length < 3}
                      className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-40"
                    >
                      Join
                    </button>
                  </div>
                  {onlineError && <p className="rounded-lg bg-red-900/40 px-2.5 py-1.5 text-[11px] text-red-300">{onlineError}</p>}
                </div>
              )}
            </div>
          )}

          {/* play button for local modes */}
          {menuTab !== 'online' && (
            <button
              onClick={menuTab === 'computer' ? playVsComputer : playPass}
              disabled={!canPlay}
              className="mt-5 w-full rounded-2xl py-4 text-lg font-black text-slate-900 shadow-[0_10px_30px_rgba(251,191,36,0.45)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: 'linear-gradient(160deg,#fde68a,#f59e0b 55%,#d97706)' }}
            >
              ▶ PLAY {menuTab === 'computer' ? 'VS COMPUTER' : 'PASS & PLAY'}
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      {!canPlay && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-950/60 px-4 py-2.5 ring-1 ring-red-500/40">
          <WifiOff size={14} className="text-red-300" />
          <span className="text-xs text-red-200">Not enough coins for this table.</span>
          <button onClick={refillCoins} className="rounded-full bg-amber-500 px-3 py-1 text-[11px] font-black text-slate-900">
            Get {FREE_REFILL.toLocaleString()} free
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-[10px] text-slate-500">
        Roll a 6 to leave home · captures give an extra roll · stars & starts are safe · exact roll to finish · three 6s = lose turn
      </p>
    </div>
  )
}
