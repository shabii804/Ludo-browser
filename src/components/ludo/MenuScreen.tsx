'use client'

// ============================================================
// Main menu - Ludo Star 2017 style: wooden table, gold-star
// logo, big carved buttons, coins bar, table setup panel.
// ============================================================

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Globe, KeyRound, Loader2, Users, Volume2, VolumeX, Wifi, WifiOff, X } from 'lucide-react'
import { useLudo } from '@/stores/ludoStore'
import { AVATARS, FREE_REFILL, MODE_DESC, MODE_LABELS, STAKES } from '@/lib/ludo/constants'
import type { GameMode } from '@/lib/ludo/types'

// ---------- little pieces ----------

function Coin({ size = 20 }: { size?: number }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #ffef9e, #f7c948 55%, #b8860b)',
          boxShadow: 'inset 0 -2px 3px rgba(120,60,0,0.55), 0 1px 2px rgba(0,0,0,0.45)',
        }}
      />
      <span
        className="absolute inset-0 grid place-items-center"
        style={{ fontSize: size * 0.52, color: '#9a6a00', textShadow: '0 1px 0 rgba(255,240,180,0.7)' }}
      >
        ★
      </span>
    </span>
  )
}

function CoinChip({ coins, onRefill }: { coins: number; onRefill: () => void }) {
  return (
    <button
      onClick={onRefill}
      className="ls-panel flex items-center gap-2 rounded-full py-1.5 pl-3 pr-2 transition hover:brightness-110"
      title="Tap for free refill"
      aria-label={`Coins ${coins}. Tap for free refill`}
    >
      <Coin />
      <span className="ls-font text-sm text-amber-100">{coins.toLocaleString()}</span>
      <span
        className="grid h-5 w-5 place-items-center rounded-full text-[14px] font-black leading-none text-white"
        style={{
          background: 'linear-gradient(180deg,#6cc257,#327c25)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)',
        }}
      >
        +
      </span>
    </button>
  )
}

function MenuButton({
  label,
  icon,
  green,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  green?: boolean
  active?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`ls-btn ls-font flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-lg text-white ${green ? 'ls-btn-green' : ''}`}
      style={active ? { outline: '3px solid rgba(255,217,119,0.95)', outlineOffset: '3px' } : undefined}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
        style={{
          background: 'rgba(255,255,255,0.22)',
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.45), 0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {icon}
      </span>
      {label}
    </motion.button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="ls-font mb-1.5 text-xs tracking-wide text-amber-200/85">{children}</p>
}

function OptionChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-xl px-2 py-2 text-center transition ${disabled ? 'opacity-35' : ''} ${active ? '' : 'hover:brightness-125'}`}
      style={
        active
          ? {
              background: 'linear-gradient(180deg,#ffcf4d,#e39a14)',
              border: '2px solid #fff0c0',
              boxShadow: '0 3px 0 #8a5a08, 0 6px 10px rgba(0,0,0,0.35)',
            }
          : {
              background: 'linear-gradient(180deg,#5f3a1c,#422711)',
              border: '2px solid #9a7038',
              boxShadow: '0 3px 0 rgba(0,0,0,0.35)',
            }
      }
    >
      {children}
    </button>
  )
}

// ---------- logo ----------

function Logo() {
  return (
    <motion.div
      initial={{ y: -30, opacity: 0, scale: 0.85 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 210, damping: 14 }}
      className="relative mt-2 text-center"
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="mx-auto mb-0.5 h-10 w-10 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
        animate={{ rotate: [ -8, 8, -8 ], scale: [1, 1.12, 1] }}
        transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
      >
        <path
          d="M12 1.6l3 6.4 7 .9-5.2 4.8 1.4 6.9L12 17.2l-6.2 3.4 1.4-6.9L2 8.9l7-.9z"
          fill="#ffd23e"
          stroke="#a05a08"
          strokeWidth="1.4"
        />
      </motion.svg>
      <h1 className="ls-font ls-logo-ludo text-6xl leading-[0.95]">LUDO</h1>
      <div className="ls-font ls-logo-star -mt-1 text-4xl leading-none">STAR</div>
      <p className="ls-font mt-1.5 text-[11px] tracking-[0.32em] text-amber-100/75">PLAY WITH EVERYONE</p>
    </motion.div>
  )
}

// ---------- screen ----------

export default function MenuScreen() {
  const profile = useLudo((s) => s.profile)
  const hydrated = useLudo((s) => s.hydrated)
  const updateProfile = useLudo((s) => s.updateProfile)
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
  const soundOn = useLudo((s) => s.soundOn)
  const toggleSound = useLudo((s) => s.toggleSound)

  const [mode, setMode] = useState<GameMode>('classic')
  const [stake, setStake] = useState<number>(100)
  const [botCount, setBotCount] = useState(1)
  const [passCount, setPassCount] = useState(2)
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

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
    const names = ['Player 2', 'Player 3', 'Player 4']
    const players = [
      { name: profile.name, avatar: profile.avatar, isBot: false },
      ...Array.from({ length: passCount - 1 }, (_, i) => ({
        name: names[i],
        avatar: AVATARS[(i * 4 + 2) % AVATARS.length],
        isBot: false,
      })),
    ]
    startLocalGame({ mode, stake, players })
  }

  if (!hydrated) {
    return (
      <div className="ls-wood grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-200" />
      </div>
    )
  }

  return (
    <div className="ls-wood relative min-h-screen">
      <div className="ls-vignette" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-4 pb-8 pt-4">
        {/* top bar: avatar | coins */}
        <div className="flex w-full items-start justify-between">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="group flex flex-col items-center gap-1"
            aria-label="Edit profile"
          >
            <span
              className="grid h-14 w-14 place-items-center rounded-full text-2xl transition group-active:scale-95"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #3d5a73, #1d2f40)',
                border: '3px solid #f3d9a4',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)',
              }}
            >
              {profile.avatar}
            </span>
            <span className="ls-font max-w-[84px] truncate text-[11px] text-amber-100/90">{profile.name}</span>
          </button>
          <CoinChip coins={profile.coins} onRefill={refillCoins} />
        </div>

        {/* profile panel */}
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              className="ls-panel mt-3 w-full rounded-2xl p-3.5"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="ls-font text-sm text-amber-100">YOUR PROFILE</p>
                <button onClick={() => setProfileOpen(false)} aria-label="Close profile" className="text-amber-200/80 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <input
                value={profile.name}
                onChange={(e) => updateProfile({ name: e.target.value.slice(0, 14) })}
                className="ls-chip w-full rounded-lg px-2.5 py-1.5 text-sm font-bold text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:ring-1 focus:ring-amber-300"
                aria-label="Your name"
                maxLength={14}
                placeholder="Your name"
              />
              <div className="mt-1 flex gap-3 text-[11px] font-bold">
                <span className="text-green-300">{profile.wins}W</span>
                <span className="text-red-300">{profile.losses}L</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => updateProfile({ avatar: a })}
                    className={`grid h-8 w-8 place-items-center rounded-full text-lg transition ${
                      profile.avatar === a ? 'scale-110' : 'hover:scale-105'
                    }`}
                    style={
                      profile.avatar === a
                        ? { background: 'rgba(255,207,77,0.25)', boxShadow: '0 0 0 2px #ffd977' }
                        : { background: 'rgba(0,0,0,0.35)', boxShadow: 'inset 0 0 0 1.5px #9a7038' }
                    }
                    aria-label={`Choose avatar ${a}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* logo */}
        <Logo />

        {/* main buttons */}
        <div className="mt-5 flex w-full flex-col gap-3">
          <MenuButton label="PLAY ONLINE" icon={<Globe size={19} />} green active={menuTab === 'online'} onClick={() => setMenuTab('online')} />
          <MenuButton label="PASS N PLAY" icon={<Users size={19} />} active={menuTab === 'pass'} onClick={() => setMenuTab('pass')} />
          <MenuButton label="VS COMPUTER" icon={<Bot size={19} />} active={menuTab === 'computer'} onClick={() => setMenuTab('computer')} />
          <MenuButton label="PRIVATE ROOM" icon={<KeyRound size={19} />} onClick={() => setMenuTab('online')} />
        </div>

        {/* setup panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={menuTab + (lobby?.code ?? '')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="ls-panel mt-4 w-full rounded-3xl p-4"
          >
            {/* game rules variant */}
            <SectionLabel>GAME MODE</SectionLabel>
            <div className="flex gap-2">
              {(['classic', 'quick', 'master'] as GameMode[]).map((m) => (
                <OptionChip key={m} active={mode === m} onClick={() => setMode(m)}>
                  <div className={`ls-font text-xs ${mode === m ? 'text-[#4a2c00]' : 'text-amber-100'}`}>{MODE_LABELS[m]}</div>
                  <div className={`mt-0.5 text-[9px] leading-tight ${mode === m ? 'text-amber-800' : 'text-amber-200/55'}`}>{MODE_DESC[m]}</div>
                </OptionChip>
              ))}
            </div>

            <div className="mt-3">
              <SectionLabel>TABLE STAKE · WINNER TAKES THE POT</SectionLabel>
              <div className="flex gap-2">
                {STAKES.map((s) => {
                  const afford = profile.coins >= s
                  return (
                    <OptionChip key={s} active={stake === s} disabled={!afford} onClick={() => setStake(s)}>
                      <div className="flex items-center justify-center gap-1">
                        <Coin size={13} />
                        <span className={`ls-font text-xs ${stake === s ? 'text-[#4a2c00]' : 'text-amber-100'}`}>{s.toLocaleString()}</span>
                      </div>
                    </OptionChip>
                  )
                })}
              </div>
            </div>

            {menuTab === 'computer' && (
              <div className="mt-3">
                <SectionLabel>OPPONENTS</SectionLabel>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <OptionChip key={n} active={botCount === n} onClick={() => setBotCount(n)}>
                      <div className={`ls-font text-xs ${botCount === n ? 'text-[#4a2c00]' : 'text-amber-100'}`}>
                        {n} Bot{n > 1 ? 's' : ''}
                      </div>
                    </OptionChip>
                  ))}
                </div>
              </div>
            )}

            {menuTab === 'pass' && (
              <div className="mt-3">
                <SectionLabel>PLAYERS ON THIS DEVICE</SectionLabel>
                <div className="flex gap-2">
                  {[2, 3, 4].map((n) => (
                    <OptionChip key={n} active={passCount === n} onClick={() => setPassCount(n)}>
                      <div className={`ls-font text-xs ${passCount === n ? 'text-[#4a2c00]' : 'text-amber-100'}`}>{n} Players</div>
                    </OptionChip>
                  ))}
                </div>
              </div>
            )}

            {menuTab === 'online' && (
              <div className="mt-3">
                {onlineStatus === 'idle' || onlineStatus === 'connecting' ? (
                  <div className="ls-chip flex items-center gap-2 rounded-xl px-3 py-2.5">
                    <Wifi size={14} className="animate-pulse text-amber-300" />
                    <span className="text-xs text-amber-100/90">Connecting to game server...</span>
                  </div>
                ) : lobby ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <SectionLabel>ROOM CODE</SectionLabel>
                        <p className="ls-font text-3xl tracking-[0.22em] text-amber-200">{lobby.code}</p>
                      </div>
                      <div className="text-right text-[10px] text-amber-100/70">
                        {lobby.players.length}/{lobby.seats} players
                        <br />
                        {MODE_LABELS[lobby.mode]} · ★{lobby.stake}
                      </div>
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                      {lobby.players.map((p, i) => (
                        <div key={p.id + i} className="ls-chip flex items-center gap-2 rounded-xl px-2.5 py-1.5">
                          <span className="text-lg">{p.avatar}</span>
                          <span className="ls-name-shadow flex-1 truncate text-xs font-bold text-amber-50">{p.name}</span>
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase text-white"
                            style={{ background: p.color === 'red' ? '#e5453c' : p.color === 'green' ? '#46a848' : p.color === 'yellow' ? '#d99f0e' : '#2a8ee0' }}
                          >
                            {p.color}
                          </span>
                          {p.isBot && <span className="text-[9px] text-amber-200/60">BOT</span>}
                        </div>
                      ))}
                      {Array.from({ length: Math.max(0, lobby.seats - lobby.players.length) }).map((_, i) => (
                        <div key={`empty${i}`} className="flex items-center gap-2 rounded-xl border border-dashed border-amber-700/60 px-2.5 py-1.5">
                          <span className="text-xs text-amber-200/45">Waiting for player...</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {lobby.players.length < lobby.seats && lobby.hostId === profile.id && (
                        <button onClick={onlineAddBot} className="ls-btn ls-font flex-1 rounded-xl py-2.5 text-xs text-white">
                          + ADD BOT
                        </button>
                      )}
                      {lobby.hostId === profile.id ? (
                        <button onClick={onlineStart} className="ls-btn ls-btn-green ls-font flex-1 rounded-xl py-2.5 text-xs text-white">
                          START GAME
                        </button>
                      ) : (
                        <div className="ls-chip flex-1 rounded-xl py-2.5 text-center text-xs font-bold text-amber-100/80">Waiting for host...</div>
                      )}
                      <button
                        onClick={onlineLeave}
                        className="ls-font rounded-xl border-[2.5px] border-red-200/80 px-3 py-2.5 text-xs text-white"
                        style={{
                          background: 'linear-gradient(180deg,#d9534f,#a5231d)',
                          boxShadow: '0 3px 0 #6d1310, 0 6px 10px rgba(0,0,0,0.35)',
                          textShadow: '0 1px 0 rgba(80,10,5,0.6)',
                        }}
                      >
                        LEAVE
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
                      className="ls-btn ls-btn-green ls-font w-full rounded-2xl py-3.5 text-base text-white disabled:opacity-50"
                    >
                      {busy ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" /> FINDING PLAYERS...
                        </span>
                      ) : (
                        '⚡ QUICK MATCH'
                      )}
                    </button>
                    <button
                      onClick={() => canPlay && onlineCreate({ stake, mode, seats: 4, botFill: true })}
                      disabled={!canPlay}
                      className="ls-btn ls-font w-full rounded-2xl py-2.5 text-sm text-white disabled:opacity-50"
                    >
                      CREATE PRIVATE ROOM
                    </button>
                    <div className="flex gap-2">
                      <input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder="ROOM CODE"
                        className="ls-chip min-w-0 flex-1 rounded-xl px-3 py-2.5 text-center text-sm font-black tracking-[0.25em] text-amber-50 placeholder:tracking-normal placeholder:text-amber-200/40 focus:outline-none focus:ring-1 focus:ring-amber-300"
                        aria-label="Room code"
                      />
                      <button
                        onClick={() => canPlay && joinCode.length >= 3 && onlineJoin(joinCode, stake, mode)}
                        disabled={!canPlay || joinCode.length < 3}
                        className="ls-btn ls-btn-green ls-font rounded-xl px-5 py-2.5 text-sm text-white disabled:opacity-40"
                      >
                        JOIN
                      </button>
                    </div>
                    {onlineError && (
                      <p className="rounded-lg border border-red-400/40 bg-red-950/60 px-2.5 py-1.5 text-[11px] text-red-200">{onlineError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* play button for local modes */}
            {menuTab !== 'online' && (
              <button
                onClick={menuTab === 'computer' ? playVsComputer : playPass}
                disabled={!canPlay}
                className="ls-btn ls-btn-green ls-font mt-4 w-full rounded-2xl py-3.5 text-xl text-white disabled:opacity-50"
              >
                ▶ PLAY
              </button>
            )}
          </motion.div>
        </AnimatePresence>

        {!canPlay && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-950/70 px-4 py-2.5">
            <WifiOff size={14} className="text-red-300" />
            <span className="text-xs text-red-200">Not enough coins for this table.</span>
            <button onClick={refillCoins} className="ls-font rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-3 py-1 text-[11px] text-[#4a2c00] shadow">
              GET {FREE_REFILL.toLocaleString()} FREE
            </button>
          </div>
        )}

        {/* bottom bar */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={toggleSound}
            className="ls-panel grid h-10 w-10 place-items-center rounded-full text-amber-100 transition hover:brightness-125"
            aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          >
            {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <p className="ls-font text-[10px] tracking-wider text-amber-100/60">LUDO STAR · WEB EDITION</p>
        </div>
        <p className="mt-1.5 max-w-xs text-center text-[9px] leading-relaxed text-amber-100/40">
          Roll a 6 to leave home · captures give an extra roll · stars & starts are safe · exact roll to finish · three 6s = lose turn
        </p>
      </div>
    </div>
  )
}
