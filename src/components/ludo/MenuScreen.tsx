'use client'

// ============================================================
// HOME LOBBY — premium gaming hub
// Header (logo, avatar, level, XP, coins, gems, bell, settings)
// Tabs: Home / Friends / Leaderboard / Rewards / Profile
// Mode selection with illustrated cards + action dock.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell, Bot, Check, ChevronRight, Copy, Crown, Gift, Globe, Home as HomeIcon,
  KeyRound, Lock, Loader2, Medal, Send, Sparkles, Trophy, User as UserIcon,
  Users, Volume2, VolumeX, Wifi, X, Zap,
} from 'lucide-react'
import { useLudo } from '@/stores/ludoStore'
import { AVATARS, FREE_REFILL, MODE_DESC, MODE_LABELS, STAKES } from '@/lib/ludo/constants'
import { ACHIEVEMENTS, BOT_FRIENDS, LEADERBOARD_SEED, levelFromWins, rankTitle } from '@/lib/ludo/social'
import { DAILY_REWARDS } from '@/stores/ludoStore'
import { AvatarRing, CoinIcon, GemIcon, LevelBadge, LudoLogo, ModeIllustration, Tag, XPBar, type ModeArt } from '@/components/ludo/ui'
import type { GameMode } from '@/lib/ludo/types'

type LobbyTab = 'home' | 'friends' | 'leaderboard' | 'rewards' | 'profile'

interface ModeCardDef {
  id: string
  name: string
  desc: string
  art: ModeArt
  online?: boolean
  players: string
  comingSoon?: boolean
  free?: boolean
}

const MODE_CARDS: ModeCardDef[] = [
  { id: 'classic', name: 'Classic', desc: MODE_DESC.classic, art: 'classic', online: true, players: '2-4' },
  { id: 'quick', name: 'Quick', desc: MODE_DESC.quick, art: 'quick', online: true, players: '2-4' },
  { id: 'master', name: 'Master', desc: MODE_DESC.master, art: 'master', online: true, players: '2-4' },
  { id: 'duel', name: '1 vs 1', desc: 'Head-to-head duel · first to finish wins', art: 'duel', online: true, players: '2' },
  { id: 'party', name: 'Four Player', desc: 'Full table mayhem with four rivals', art: 'party', online: true, players: '4' },
  { id: 'team', name: 'Team Mode', desc: '2 v 2 partnered play', art: 'team', players: '4', comingSoon: true },
  { id: 'practice', name: 'Practice', desc: 'Free training vs smart bots', art: 'practice', players: '1v3', free: true },
  { id: 'private', name: 'Private Room', desc: 'Play friends with a room code', art: 'private', online: true, players: '2-4' },
]

const EVENTS = [
  { icon: '💎', title: 'Season 1 is live', text: 'Climb the leaderboard and collect gems for every win.' },
  { icon: '🎁', title: 'Daily login streak', text: 'Claim growing coin rewards every single day.' },
  { icon: '🎉', title: 'Weekend tables', text: 'Bigger pots on Master mode every Saturday & Sunday.' },
]

// ---------- small building blocks ----------

function CurrencyChip({
  value,
  icon,
  onClick,
  label,
}: {
  value: number
  icon: React.ReactNode
  onClick: () => void
  label: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      className="ls-chip flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-2.5"
      aria-label={label}
      title={label}
    >
      {icon}
      <span className="ls-font text-sm text-amber-100">{value.toLocaleString()}</span>
      <span
        className="grid h-4 w-4 place-items-center rounded-full text-[12px] font-black leading-none text-white"
        style={{ background: 'linear-gradient(180deg,#6cc257,#327c25)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
      >
        +
      </span>
    </motion.button>
  )
}

function SectionTitle({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h2 className="ls-font flex items-center gap-2 text-base text-indigo-100">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/20 text-violet-300 ring-1 ring-violet-400/40">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
  )
}

function ModeCard({
  def,
  selected,
  onSelect,
}: {
  def: ModeCardDef
  selected: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      layout
      onClick={onSelect}
      disabled={def.comingSoon}
      whileHover={def.comingSoon ? undefined : { y: -4 }}
      whileTap={def.comingSoon ? undefined : { scale: 0.97 }}
      className={`ls-panel group relative overflow-hidden rounded-2xl p-3 text-left transition-shadow sm:p-4 ${
        selected ? 'ls-panel-gold' : ''
      } ${def.comingSoon ? 'opacity-60' : 'hover:shadow-[0_16px_36px_rgba(80,30,180,0.35)]'}`}
      style={selected ? { boxShadow: '0 0 0 2px rgba(246,196,83,0.8), 0 12px 30px rgba(160,100,10,0.25)' } : undefined}
      aria-pressed={selected}
    >
      {selected && (
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full"
          style={{ background: 'linear-gradient(180deg,#ffe08a,#e09b1a)', boxShadow: '0 0 10px rgba(246,196,83,0.7)' }}
        >
          <Check size={14} color="#4a2c00" strokeWidth={3.5} />
        </motion.span>
      )}
      {def.comingSoon && (
        <span className="absolute right-2 top-2 z-10">
          <Tag tone="slate">
            <Lock size={10} /> Soon
          </Tag>
        </span>
      )}
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-violet-500/15 blur-2xl transition group-hover:bg-violet-500/25" />
      <div className="relative flex items-center gap-3">
        <div className="shrink-0 rounded-xl bg-indigo-950/60 p-1 ring-1 ring-white/10">
          <ModeIllustration kind={def.art} size={64} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="ls-font block truncate text-lg text-white">{def.name}</span>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-indigo-200/70">{def.desc}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-indigo-300/70">
            {def.free ? (
              <Tag tone="green">Free</Tag>
            ) : def.comingSoon ? null : (
              <Tag tone="violet">
                <Globe size={9} /> Online
              </Tag>
            )}
            <span className="inline-flex items-center gap-1">
              <Users size={11} /> {def.players}
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap size={11} /> {def.id === 'quick' ? '~10 min' : def.id === 'classic' ? '~20 min' : def.id === 'master' ? '~15 min' : 'fun'}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

function FriendRow({ f, onPlay }: { f: (typeof BOT_FRIENDS)[number]; onPlay?: () => void }) {
  const statusColor = f.status === 'online' ? '#4ade80' : f.status === 'in-game' ? '#f6c453' : '#64748b'
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="ls-chip flex items-center gap-2.5 rounded-2xl px-3 py-2"
    >
      <div className="relative">
        <AvatarRing avatar={f.avatar} size={38} />
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full ring-2 ring-[#0b0f26]" style={{ background: statusColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="ls-font truncate text-sm text-white">{f.name}</p>
        <p className="text-[10px] text-indigo-300/70">
          {f.status === 'in-game' ? `Playing at ${f.table}` : f.status === 'online' ? `Level ${f.level} · Online` : 'Offline'}
        </p>
      </div>
      {f.status !== 'offline' && onPlay && (
        <button
          onClick={onPlay}
          className="ls-btn ls-btn-green ls-font flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] text-white"
        >
          <Zap size={11} /> PLAY
        </button>
      )}
    </motion.div>
  )
}

// ---------- main screen ----------

export default function MenuScreen() {
  const profile = useLudo((s) => s.profile)
  const hydrated = useLudo((s) => s.hydrated)
  const updateProfile = useLudo((s) => s.updateProfile)
  const refillCoins = useLudo((s) => s.refillCoins)
  const claimDaily = useLudo((s) => s.claimDaily)
  const daily = useLudo((s) => s.daily)
  const startLocalGame = useLudo((s) => s.startLocalGame)
  const onlineConnect = useLudo((s) => s.onlineConnect)
  const onlineStatus = useLudo((s) => s.onlineStatus)
  const onlineError = useLudo((s) => s.onlineError)
  const onlineQuick = useLudo((s) => s.onlineQuick)
  const onlineCreate = useLudo((s) => s.onlineCreate)
  const onlineJoin = useLudo((s) => s.onlineJoin)
  const soundOn = useLudo((s) => s.soundOn)
  const toggleSound = useLudo((s) => s.toggleSound)

  const [tab, setTab] = useState<LobbyTab>('home')
  const [selected, setSelected] = useState<string | null>(null)
  const [stake, setStake] = useState<number>(100)
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // pre-warm online connection so quick match feels instant
  useEffect(() => {
    onlineConnect()
  }, [onlineConnect])

  const lvl = levelFromWins(profile.wins)
  const selectedDef = MODE_CARDS.find((m) => m.id === selected) ?? null
  const dailyClaimable = daily?.lastClaim !== new Date().toLocaleDateString('en-CA')
  const featured = useMemo(() => EVENTS[0], [])

  const totalGames = profile.wins + profile.losses
  const winRate = totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0

  function practicePlayers() {
    const botAvatars = AVATARS.filter((a) => a !== profile.avatar)
    const botNames = ['Rocky', 'Zuby', 'Lola']
    return [
      { name: profile.name, avatar: profile.avatar, isBot: false },
      ...botNames.map((n, i) => ({ name: n, avatar: botAvatars[(i * 5) % botAvatars.length], isBot: true })),
    ]
  }

  function startVsComputer(gameMode: GameMode, playerCount: 2 | 4, useStake: number) {
    const botAvatars = AVATARS.filter((a) => a !== profile.avatar)
    const botNames = ['Rocky', 'Zuby', 'Lola', 'Kiki']
    const bots = playerCount === 2 ? 1 : 3
    const players = [{ name: profile.name, avatar: profile.avatar, isBot: false }]
    for (let i = 0; i < bots; i++) {
      players.push({ name: botNames[i], avatar: botAvatars[(i * 5) % botAvatars.length], isBot: true })
    }
    startLocalGame({ mode: gameMode, stake: useStake, players })
  }

  function startPass(gameMode: GameMode, playerCount: 2 | 4, useStake: number) {
    const names = ['Player 2', 'Player 3', 'Player 4']
    const players = [
      { name: profile.name, avatar: profile.avatar, isBot: false },
      ...Array.from({ length: playerCount - 1 }, (_, i) => ({
        name: names[i],
        avatar: AVATARS[(i * 4 + 2) % AVATARS.length],
        isBot: false,
      })),
    ]
    startLocalGame({ mode: gameMode, stake: useStake, players })
  }

  function dockGameMode(): GameMode {
    if (selectedDef?.id === 'quick') return 'quick'
    if (selectedDef?.id === 'master') return 'master'
    return 'classic'
  }

  function dockSeats(): 2 | 4 {
    return selectedDef?.id === 'duel' ? 2 : 4
  }

  function playOnline() {
    if (!selectedDef || busy) return
    const gm = dockGameMode()
    setBusy(true)
    if (selectedDef.id === 'duel') {
      onlineCreate({ stake, mode: gm, seats: 2, botFill: false })
      setTimeout(() => setBusy(false), 2500)
    } else {
      onlineQuick(stake, gm)
      setTimeout(() => setBusy(false), 2500)
    }
  }

  function copyInvite(code: string) {
    if (!code) return
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    }).catch(() => undefined)
  }

  const canPlay = profile.coins >= stake

  if (!hydrated) {
    return (
      <div className="ls-bg grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-3">
          <LudoLogo />
          <Loader2 className="h-6 w-6 animate-spin text-violet-300" />
        </div>
      </div>
    )
  }

  return (
    <div className="ls-bg relative min-h-screen">
      <div className="ls-starfield" />

      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0f26]/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-5">
          <LudoLogo compact />

          {/* desktop identity */}
          <div className="ml-3 hidden min-w-0 flex-1 items-center gap-2.5 md:flex">
            <div className="relative">
              <AvatarRing avatar={profile.avatar} size={42} />
              <LevelBadge level={lvl.level} />
            </div>
            <div className="min-w-0">
              <p className="ls-font truncate text-sm text-white">{profile.name}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-200/90">LV {lvl.level}</span>
                <XPBar pct={lvl.pct} className="w-24" />
              </div>
            </div>
            <span className="ls-font rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-200 ring-1 ring-violet-400/40">
              {rankTitle(lvl.level)}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <CurrencyChip
              value={profile.coins}
              icon={<CoinIcon size={17} />}
              onClick={refillCoins}
              label={`Coins ${profile.coins} — tap for free refill`}
            />
            <div className="ls-chip flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-2.5">
              <GemIcon size={17} />
              <span className="ls-font text-sm text-teal-100">{profile.gems.toLocaleString()}</span>
            </div>

            {/* notifications */}
            <div className="relative">
              <button
                onClick={() => { setBellOpen((o) => !o); setSettingsOpen(false) }}
                className="ls-panel relative grid h-9 w-9 place-items-center rounded-full text-amber-200 transition hover:text-white"
                aria-label="Notifications"
              >
                <Bell size={16} />
                {dailyClaimable && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b0f26]" />}
              </button>
              <AnimatePresence>
                {bellOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="ls-panel absolute right-0 top-11 z-50 w-72 rounded-2xl p-3"
                  >
                    <p className="ls-font mb-2 text-xs text-amber-100">ANNOUNCEMENTS</p>
                    <div className="space-y-2">
                      {EVENTS.map((e) => (
                        <div key={e.title} className="ls-chip flex items-start gap-2.5 rounded-xl px-2.5 py-2">
                          <span className="text-lg leading-none">{e.icon}</span>
                          <div>
                            <p className="ls-font text-xs text-white">{e.title}</p>
                            <p className="mt-0.5 text-[10px] leading-snug text-indigo-200/70">{e.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* settings */}
            <div className="relative">
              <button
                onClick={() => { setSettingsOpen((o) => !o); setBellOpen(false) }}
                className="ls-panel grid h-9 w-9 place-items-center rounded-full text-indigo-200 transition hover:text-white"
                aria-label="Settings"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              <AnimatePresence>
                {settingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="ls-panel absolute right-0 top-11 z-50 w-56 rounded-2xl p-3"
                  >
                    <button
                      onClick={toggleSound}
                      className="ls-chip flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-indigo-100 transition hover:brightness-125"
                    >
                      Sound effects
                      {soundOn ? <Volume2 size={16} className="text-emerald-300" /> : <VolumeX size={16} className="text-slate-400" />}
                    </button>
                    <button
                      onClick={() => { setTab('profile'); setSettingsOpen(false) }}
                      className="ls-chip mt-1.5 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-indigo-100 transition hover:brightness-125"
                    >
                      Edit profile <ChevronRight size={15} className="text-indigo-300" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ============ MAIN ============ */}
      <main className="relative z-10 mx-auto w-full max-w-6xl px-3 pb-28 pt-4 sm:px-5 xl:px-6 xl:pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* ---------------- HOME ---------------- */}
            {tab === 'home' && (
              <div className="space-y-5">
                {/* hero + featured */}
                <section className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ls-panel ls-panel-gold relative overflow-hidden rounded-3xl p-5 sm:p-7"
                  >
                    <motion.div
                      className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-violet-600/25 blur-3xl"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                    />
                    <div className="pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-amber-500/15 blur-3xl" />
                    <div className="relative">
                      <Tag tone="gold"><Sparkles size={10} /> Welcome back</Tag>
                      <h1 className="ls-font mt-2 text-3xl leading-tight text-white sm:text-4xl">
                        Ready to roll, <span style={{ color: '#ffd75e' }}>{profile.name}</span>?
                      </h1>
                      <p className="mt-1 max-w-md text-sm text-indigo-200/75">
                        Jump into a live table, practice against bots, or gather friends on one device.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2.5">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSelected('classic')}
                          className="ls-btn ls-btn-gold ls-font flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-lg text-white"
                        >
                          <Zap size={20} /> PLAY NOW
                        </motion.button>
                        <button
                          onClick={() => startVsComputer('classic', 4, 0)}
                          className="ls-btn ls-font flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm text-white"
                        >
                          <Bot size={17} /> Quick Practice
                        </button>
                        <div className="ls-chip flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] text-indigo-200/80">
                          <Wifi size={12} className={onlineStatus === 'connected' || onlineStatus === 'idle' ? 'text-emerald-400' : 'animate-pulse text-amber-300'} />
                          {onlineStatus === 'connected' ? 'Server online' : 'Connecting...'}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* featured banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 }}
                    className="ls-panel relative overflow-hidden rounded-3xl p-5"
                  >
                    <motion.div
                      className="absolute right-4 top-4"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    >
                      <ModeIllustration kind="master" size={88} />
                    </motion.div>
                    <Tag tone="violet"><Crown size={10} /> Featured</Tag>
                    <h3 className="ls-font mt-2 text-xl text-white">Master Tables</h3>
                    <p className="mt-1 max-w-[55%] text-[11px] leading-snug text-indigo-200/75">
                      Two dice, double drama. Masters bet big and capture harder — winner takes the whole pot.
                    </p>
                    <button
                      onClick={() => { setSelected('master'); window.scrollTo({ top: 320, behavior: 'smooth' }) }}
                      className="ls-font mt-3 inline-flex items-center gap-1 text-xs text-amber-300 transition hover:text-amber-200"
                    >
                      Take a seat <ChevronRight size={13} />
                    </button>
                    <div className="mt-3 flex items-center gap-3 text-[10px] text-indigo-300/70">
                      <span className="inline-flex items-center gap-1"><Trophy size={11} className="text-amber-300" /> Season 1</span>
                      <span className="inline-flex items-center gap-1"><GemIcon size={12} /> +2 gems per win</span>
                    </div>
                  </motion.div>
                </section>

                {/* mode cards */}
                <section>
                  <SectionTitle
                    icon={<Zap size={14} />}
                    title="Game Modes"
                    action={<span className="text-[11px] text-indigo-300/60">Pick a table, choose your stake</span>}
                  />
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {MODE_CARDS.map((def) => (
                      <ModeCard key={def.id} def={def} selected={selected === def.id} onSelect={() => setSelected(selected === def.id ? null : def.id)} />
                    ))}
                  </div>

                  {/* action dock */}
                  <AnimatePresence>
                    {selectedDef && !selectedDef.comingSoon && (
                      <motion.div
                        initial={{ opacity: 0, y: 16, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 12, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="ls-panel ls-panel-gold mt-3 rounded-2xl p-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="ls-font text-xs uppercase tracking-wide text-amber-200/85">Entry stake</span>
                              <div className="flex gap-1.5">
                                {(selectedDef.free ? [0] : [...STAKES]).map((s) => {
                                  const afford = profile.coins >= s
                                  return (
                                    <button
                                      key={s}
                                      onClick={() => afford && setStake(s)}
                                      disabled={!afford || selectedDef.free}
                                      data-active={stake === s}
                                      className={`ls-option ls-font flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs ${
                                        stake === s ? 'text-white' : 'text-indigo-100'
                                      } ${!afford ? 'opacity-35' : ''} ${selectedDef.free ? 'cursor-default' : ''}`}
                                    >
                                      {s === 0 ? 'FREE' : <CoinIcon size={13} />}
                                      {s > 0 && s.toLocaleString()}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="ml-auto flex flex-wrap items-center gap-2">
                              {selectedDef.online && !selectedDef.free && (
                                <button
                                  onClick={playOnline}
                                  disabled={!canPlay || busy}
                                  className="ls-btn ls-btn-gold ls-font flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm text-white disabled:opacity-50"
                                >
                                  {busy ? (
                                    <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> FINDING TABLE...</span>
                                  ) : (
                                    <>
                                      <Globe size={15} /> PLAY ONLINE
                                    </>
                                  )}
                                </button>
                              )}
                              {selectedDef.id === 'private' ? (
                                <button
                                  onClick={() => selectedDef.online && onlineCreate({ stake, mode: 'classic', seats: 4, botFill: true })}
                                  disabled={!canPlay || busy}
                                  className="ls-btn ls-font flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white disabled:opacity-50"
                                >
                                  <KeyRound size={14} /> CREATE ROOM
                                </button>
                              ) : (
                                <>
                                  {selectedDef.online && (
                                    <button
                                      onClick={() => selectedDef.online && onlineCreate({ stake, mode: dockGameMode(), seats: dockSeats(), botFill: true })}
                                      disabled={!canPlay || busy}
                                      className="ls-btn ls-font flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white disabled:opacity-50"
                                    >
                                      <KeyRound size={14} /> CREATE ROOM
                                    </button>
                                  )}
                                  <button
                                    onClick={() => selectedDef.free
                                      ? startLocalGame({ mode: 'classic', stake: 0, players: practicePlayers() })
                                      : startVsComputer(dockGameMode(), dockSeats(), selectedDef.free ? 0 : stake)}
                                    className="ls-btn ls-btn-green ls-font flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white"
                                  >
                                    <Bot size={15} /> {selectedDef.free ? 'START PRACTICE' : 'VS COMPUTER'}
                                  </button>
                                  <button
                                    onClick={() => startPass(dockGameMode(), dockSeats(), selectedDef.free ? 0 : stake)}
                                    className="ls-btn ls-btn-ghost ls-font flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-indigo-100"
                                  >
                                    <Users size={15} /> PASS N PLAY
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* join code row (private room only) */}
                          {selectedDef.id === 'private' && (
                            <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                              <input
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                                placeholder="ENTER ROOM CODE"
                                className="ls-glass-input min-w-0 flex-1 rounded-xl px-3 py-2.5 text-center text-sm font-black tracking-[0.25em] text-white placeholder:tracking-normal placeholder:text-indigo-300/40"
                                aria-label="Room code"
                              />
                              <button
                                onClick={() => canPlay && joinCode.length >= 3 && onlineJoin(joinCode, stake, 'classic')}
                                disabled={!canPlay || joinCode.length < 3}
                                className="ls-btn ls-btn-green ls-font flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm text-white disabled:opacity-40"
                              >
                                <Send size={13} /> JOIN
                              </button>
                            </div>
                          )}

                          {!canPlay && !selectedDef.free && (
                            <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-950/50 px-3 py-2">
                              <span className="text-xs text-rose-200">Not enough coins for this stake.</span>
                              <button onClick={refillCoins} className="ls-font ml-auto rounded-full px-3 py-1 text-[11px] text-[#4a2c00]" style={{ background: 'linear-gradient(180deg,#ffe08a,#e09b1a)' }}>
                                GET {FREE_REFILL.toLocaleString()} FREE
                              </button>
                            </div>
                          )}
                          {onlineError && (
                            <p className="mt-2 rounded-lg border border-rose-400/30 bg-rose-950/50 px-3 py-1.5 text-[11px] text-rose-200">{onlineError}</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* friends + daily + events */}
                <section className="grid gap-3 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <SectionTitle
                      icon={<Users size={14} />}
                      title="Friends Online"
                      action={
                        <button onClick={() => setTab('friends')} className="text-[11px] text-violet-300 transition hover:text-violet-200">
                          View all
                        </button>
                      }
                    />
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {BOT_FRIENDS.filter((f) => f.status !== 'offline').slice(0, 4).map((f) => (
                        <FriendRow key={f.name} f={f} onPlay={() => startVsComputer('classic', 4, 0)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionTitle icon={<Gift size={14} />} title="Daily Reward" />
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="ls-panel ls-panel-gold relative overflow-hidden rounded-2xl p-4"
                    >
                      <motion.div
                        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl"
                        animate={{ scale: dailyClaimable ? [1, 1.2, 1] : 1 }}
                        transition={{ repeat: Infinity, duration: 2.4 }}
                      />
                      <div className="flex items-center gap-3">
                        <motion.span
                          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl"
                          style={{ background: 'linear-gradient(160deg, rgba(246,196,83,0.25), rgba(246,196,83,0.08))', boxShadow: 'inset 0 0 0 1.5px rgba(246,196,83,0.5)' }}
                          animate={dailyClaimable ? { rotate: [0, -8, 8, 0] } : undefined}
                          transition={{ repeat: Infinity, duration: 2.2 }}
                        >
                          🎁
                        </motion.span>
                        <div className="min-w-0 flex-1">
                          <p className="ls-font text-sm text-white">
                            Day {(daily?.streak ?? 0) + (dailyClaimable ? 1 : 0)} reward
                          </p>
                          <p className="text-[11px] text-indigo-200/70">
                            {dailyClaimable
                              ? `${DAILY_REWARDS[daily ? Math.min(6, daily.streak) : 0].toLocaleString()} coins waiting`
                              : 'Claimed today — come back tomorrow'}
                          </p>
                        </div>
                        <button
                          onClick={claimDaily}
                          disabled={!dailyClaimable}
                          className={`ls-font rounded-xl px-4 py-2 text-xs text-white ${dailyClaimable ? 'ls-btn ls-btn-gold' : 'ls-chip opacity-50'}`}
                        >
                          {dailyClaimable ? 'CLAIM' : 'DONE'}
                        </button>
                      </div>
                      {/* streak pips */}
                      <div className="mt-3 flex gap-1.5">
                        {DAILY_REWARDS.map((r, i) => {
                          const reached = (daily?.streak ?? 0) > i || (dailyClaimable && (daily?.streak ?? 0) === i)
                          return (
                            <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                              <span
                                className="h-1.5 w-full rounded-full"
                                style={{ background: reached ? 'linear-gradient(90deg,#f6c453,#ffe08a)' : 'rgba(148,163,255,0.15)' }}
                              />
                              <span className={`text-[8px] ${reached ? 'text-amber-200' : 'text-indigo-300/50'}`}>{r >= 1000 ? `${r / 1000}k` : r}</span>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  </div>
                </section>

                {/* events */}
                <section>
                  <SectionTitle icon={<Bell size={14} />} title="Events & News" />
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {EVENTS.map((e, i) => (
                      <motion.div
                        key={e.title}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        whileHover={{ y: -3 }}
                        className="ls-panel rounded-2xl p-3.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/15 text-xl ring-1 ring-violet-400/30">{e.icon}</span>
                          <p className="ls-font text-sm text-white">{e.title}</p>
                        </div>
                        <p className="mt-2 text-[11px] leading-snug text-indigo-200/70">{e.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* ---------------- FRIENDS ---------------- */}
            {tab === 'friends' && (
              <div>
                <SectionTitle icon={<Users size={14} />} title="Friends" action={<span className="text-[11px] text-indigo-300/60">{BOT_FRIENDS.filter((f) => f.status !== 'offline').length} online now</span>} />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {BOT_FRIENDS.map((f) => (
                    <FriendRow key={f.name} f={f} onPlay={() => startVsComputer('classic', 4, 0)} />
                  ))}
                </div>
                <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-relaxed text-indigo-200/60">
                  Challenge a friend to a rematch on the spot, or open a Private Room from the Home tab and share the code with anyone.
                </p>
              </div>
            )}

            {/* ---------------- LEADERBOARD ---------------- */}
            {tab === 'leaderboard' && (
              <div>
                <SectionTitle icon={<Trophy size={14} />} title="Weekly Leaderboard" action={<Tag tone="gold"><Crown size={10} /> Season 1</Tag>} />
                <div className="ls-panel overflow-hidden rounded-2xl">
                  {(() => {
                    const rows = [...LEADERBOARD_SEED, { name: profile.name, avatar: profile.avatar, wins: profile.wins, trophies: Math.floor(profile.wins / 3), isYou: true }]
                      .sort((a, b) => b.wins - a.wins)
                    return rows.map((r, i) => (
                      <motion.div
                        key={r.name + i}
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`flex items-center gap-3 border-b border-white/5 px-4 py-2.5 last:border-0 ${r.isYou ? 'bg-violet-500/10' : ''}`}
                      >
                        <span
                          className="ls-font grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm"
                          style={{
                            background: i === 0 ? 'linear-gradient(180deg,#ffe08a,#e09b1a)' : i === 1 ? 'linear-gradient(180deg,#e2e8f0,#94a3b8)' : i === 2 ? 'linear-gradient(180deg,#d97706,#92400e)' : 'rgba(148,163,255,0.1)',
                            color: i < 3 ? '#3b2200' : '#c7d2fe',
                          }}
                        >
                          {i + 1}
                        </span>
                        <AvatarRing avatar={r.avatar} size={34} color={r.isYou ? 'red' : undefined} />
                        <span className={`ls-font min-w-0 flex-1 truncate text-sm ${r.isYou ? 'text-amber-200' : 'text-white'}`}>
                          {r.name}{r.isYou ? ' (You)' : ''}
                        </span>
                        <span className="hidden text-[11px] text-indigo-300/70 sm:block">{r.trophies} 🏆</span>
                        <span className="ls-font w-16 text-right text-sm text-amber-100">{r.wins} wins</span>
                      </motion.div>
                    ))
                  })()}
                </div>
                <p className="mt-3 text-[11px] text-indigo-200/50">Season resets every Monday. Wins from every mode count toward your rank.</p>
              </div>
            )}

            {/* ---------------- REWARDS ---------------- */}
            {tab === 'rewards' && (
              <div className="space-y-5">
                <div>
                  <SectionTitle icon={<Gift size={14} />} title="Daily Login Streak" />
                  <div className="ls-panel rounded-2xl p-4">
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {DAILY_REWARDS.map((r, i) => {
                        const claimedToday = i < (daily?.streak ?? 0)
                        const isNext = dailyClaimable && i === (daily?.streak ?? 0)
                        return (
                          <div
                            key={i}
                            className={`relative flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 ${isNext ? 'ls-panel-gold ls-panel' : 'ls-chip'}`}
                          >
                            {isNext && (
                              <motion.span
                                className="absolute -top-2 h-2 w-2 rounded-full bg-amber-300"
                                animate={{ scale: [1, 1.6, 1] }}
                                transition={{ repeat: Infinity, duration: 1.2 }}
                                style={{ boxShadow: '0 0 8px #f6c453' }}
                              />
                            )}
                            <span className="text-lg">{claimedToday ? '✅' : isNext ? '🎁' : '🔒'}</span>
                            <span className="flex items-center gap-0.5 text-[9px] text-indigo-200/80">
                              <CoinIcon size={10} /> {r >= 1000 ? `${r / 1000}k` : r}
                            </span>
                            <span className="text-[8px] uppercase text-indigo-300/50">Day {i + 1}</span>
                          </div>
                        )
                      })}
                    </div>
                    <button
                      onClick={claimDaily}
                      disabled={!dailyClaimable}
                      className={`ls-font mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm text-white ${dailyClaimable ? 'ls-btn ls-btn-gold' : 'ls-chip opacity-50'}`}
                    >
                      <Gift size={15} /> {dailyClaimable ? `CLAIM ${DAILY_REWARDS[daily ? Math.min(6, daily.streak) : 0].toLocaleString()} COINS` : 'CLAIMED — BACK TOMORROW'}
                    </button>
                  </div>
                </div>

                <div>
                  <SectionTitle icon={<Medal size={14} />} title="Achievements" />
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {ACHIEVEMENTS.map((a) => {
                      const val = a.progress({ wins: profile.wins, losses: profile.losses, coins: profile.coins, gems: profile.gems })
                      const done = val >= a.goal
                      return (
                        <div key={a.id} className={`ls-panel rounded-2xl p-3.5 ${done ? 'ls-panel-gold' : ''}`}>
                          <div className="flex items-center gap-2.5">
                            <span className={`grid h-10 w-10 place-items-center rounded-xl text-xl ${done ? 'bg-amber-400/20 ring-1 ring-amber-300/50' : 'bg-white/5 ring-1 ring-white/10'}`}>
                              {a.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="ls-font text-sm text-white">{a.name}</p>
                              <p className="truncate text-[10px] text-indigo-200/65">{a.desc}</p>
                            </div>
                            {done && <Check size={16} className="text-emerald-400" />}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <XPBar pct={(val / a.goal) * 100} className="flex-1" />
                            <span className="text-[9px] text-indigo-300/70">{Math.min(val, a.goal).toLocaleString()}/{a.goal.toLocaleString()}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- PROFILE ---------------- */}
            {tab === 'profile' && (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="ls-panel rounded-2xl p-4">
                  <SectionTitle icon={<UserIcon size={14} />} title="Player Card" />
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <AvatarRing avatar={profile.avatar} size={72} />
                      <LevelBadge level={lvl.level} size={30} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        value={profile.name}
                        onChange={(e) => updateProfile({ name: e.target.value.slice(0, 14) })}
                        className="ls-glass-input ls-font w-full rounded-xl px-3 py-2 text-sm font-bold text-white"
                        aria-label="Your name"
                        maxLength={14}
                        placeholder="Your name"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <span className="ls-font rounded-full bg-violet-500/15 px-2.5 py-1 text-[11px] text-violet-200 ring-1 ring-violet-400/40">
                          LV {lvl.level} · {rankTitle(lvl.level)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <XPBar pct={lvl.pct} />
                        <p className="mt-1 text-[10px] text-indigo-300/70">{lvl.xpNow}/{lvl.xpNeed} wins to level {lvl.level + 1}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Wins', value: profile.wins, tone: 'text-emerald-300' },
                      { label: 'Losses', value: profile.losses, tone: 'text-rose-300' },
                      { label: 'Win rate', value: `${winRate}%`, tone: 'text-amber-200' },
                    ].map((s) => (
                      <div key={s.label} className="ls-chip rounded-xl py-2.5">
                        <p className={`ls-font text-lg ${s.tone}`}>{s.value}</p>
                        <p className="text-[9px] uppercase tracking-wide text-indigo-300/60">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="ls-chip flex items-center justify-center gap-2 rounded-xl py-2.5">
                      <CoinIcon size={16} />
                      <span className="ls-font text-sm text-amber-100">{profile.coins.toLocaleString()}</span>
                    </div>
                    <div className="ls-chip flex items-center justify-center gap-2 rounded-xl py-2.5">
                      <GemIcon size={16} />
                      <span className="ls-font text-sm text-teal-100">{profile.gems.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="ls-panel rounded-2xl p-4">
                  <SectionTitle icon={<Sparkles size={14} />} title="Avatar" />
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map((a) => (
                      <motion.button
                        key={a}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => updateProfile({ avatar: a })}
                        className="grid h-11 w-11 place-items-center rounded-full text-xl"
                        style={
                          profile.avatar === a
                            ? { background: 'rgba(246,196,83,0.22)', boxShadow: '0 0 0 2.5px #f6c453' }
                            : { background: 'rgba(148,163,255,0.08)', boxShadow: 'inset 0 0 0 1.5px rgba(148,163,255,0.25)' }
                        }
                        aria-label={`Choose avatar ${a}`}
                      >
                        {a}
                      </motion.button>
                    ))}
                  </div>

                  <div className="mt-5 space-y-2">
                    <button
                      onClick={toggleSound}
                      className="ls-chip flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm text-indigo-100 transition hover:brightness-125"
                    >
                      <span className="flex items-center gap-2">
                        {soundOn ? <Volume2 size={16} className="text-emerald-300" /> : <VolumeX size={16} className="text-slate-400" />}
                        Sound effects
                      </span>
                      <span className={`ls-font rounded-full px-2 py-0.5 text-[10px] ${soundOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'}`}>
                        {soundOn ? 'ON' : 'OFF'}
                      </span>
                    </button>
                    <button
                      onClick={refillCoins}
                      className="ls-chip flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm text-indigo-100 transition hover:brightness-125"
                    >
                      <span className="flex items-center gap-2"><CoinIcon size={16} /> Free coin refill</span>
                      <span className="ls-font rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] text-amber-200">+{FREE_REFILL.toLocaleString()}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ============ BOTTOM NAV (below xl) ============ */}
      <nav className="ls-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0f26]/92 backdrop-blur-md xl:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 px-2 pt-1.5 pb-1.5">
          {([
            { id: 'home', icon: <HomeIcon size={20} />, label: 'Home' },
            { id: 'friends', icon: <Users size={20} />, label: 'Friends' },
            { id: 'leaderboard', icon: <Trophy size={20} />, label: 'Ranks' },
            { id: 'rewards', icon: <Gift size={20} />, label: 'Rewards', badge: dailyClaimable },
            { id: 'profile', icon: <UserIcon size={20} />, label: 'Profile' },
          ] as Array<{ id: LobbyTab; icon: React.ReactNode; label: string; badge?: boolean }>).map((item) => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="relative flex flex-col items-center gap-0.5 py-1"
                aria-current={active ? 'page' : undefined}
              >
                <motion.span
                  whileTap={{ scale: 0.85 }}
                  className={`relative grid h-9 w-9 place-items-center rounded-xl transition ${active ? 'text-white' : 'text-indigo-300/60'}`}
                  style={active ? { background: 'linear-gradient(160deg,#8b5cf6,#5b21b6)', boxShadow: '0 4px 12px rgba(109,40,217,0.45)' } : undefined}
                >
                  {item.icon}
                  {item.badge && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b0f26]" />}
                </motion.span>
                <span className={`ls-font text-[9px] uppercase tracking-wide ${active ? 'text-white' : 'text-indigo-300/50'}`}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* desktop: compact left rail (xl+) */}
      <nav className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 xl:flex">
        {([
          { id: 'home', icon: <HomeIcon size={18} />, label: 'Home' },
          { id: 'friends', icon: <Users size={18} />, label: 'Friends' },
          { id: 'leaderboard', icon: <Trophy size={18} />, label: 'Ranks' },
          { id: 'rewards', icon: <Gift size={18} />, label: 'Rewards', badge: dailyClaimable },
          { id: 'profile', icon: <UserIcon size={18} />, label: 'Profile' },
        ] as Array<{ id: LobbyTab; icon: React.ReactNode; label: string; badge?: boolean }>).map((item) => {
          const active = tab === item.id
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 3 }}
              onClick={() => setTab(item.id)}
              className="group relative flex items-center"
              aria-label={item.label}
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-2xl transition ${active ? 'text-white' : 'text-indigo-300/55 group-hover:text-indigo-100'}`}
                style={active
                  ? { background: 'linear-gradient(160deg,#8b5cf6,#5b21b6)', boxShadow: '0 6px 16px rgba(109,40,217,0.5), inset 0 1px 0 rgba(255,255,255,0.25)' }
                  : { background: 'rgba(148,163,255,0.07)', boxShadow: 'inset 0 0 0 1.5px rgba(148,163,255,0.14)' }}
              >
                {item.icon}
                {item.badge && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b0f26]" />}
              </span>
              <span className="pointer-events-none absolute left-12 z-50 whitespace-nowrap rounded-lg bg-[#0b0f26] px-2 py-1 text-[10px] text-indigo-100 opacity-0 ring-1 ring-white/15 transition group-hover:opacity-100">
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </nav>

      {/* copied toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="ls-panel fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs text-white md:bottom-8"
          >
            <Copy size={13} className="text-emerald-300" /> Copied!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
