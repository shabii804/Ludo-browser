'use client'

// Game screen: board + players + dice + emotes + chat + timer

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Volume2, VolumeX } from 'lucide-react'
import Board from '@/components/ludo/Board'
import DiceTray from '@/components/ludo/Dice'
import PlayerCard, { type PlayerCardData } from '@/components/ludo/PlayerCard'
import { ChatPanel, EmoteBar } from '@/components/ludo/EmoteBar'
import WinOverlay from '@/components/ludo/WinOverlay'
import { useLudo } from '@/stores/ludoStore'
import { COLOR_HEX } from '@/lib/ludo/board'
import { MODE_LABELS, TURN_SECONDS } from '@/lib/ludo/constants'

export default function GameScreen() {
  const game = useLudo((s) => s.game)
  const session = useLudo((s) => s.session)
  const profile = useLudo((s) => s.profile)
  const animating = useLudo((s) => s.animating)
  const diceRolling = useLudo((s) => s.diceRolling)
  const diceValues = useLudo((s) => s.diceValues)
  const canRoll = useLudo((s) => s.canRoll)
  const movableTokenIds = useLudo((s) => s.movableTokenIds)
  const selectedDie = useLudo((s) => s.selectedDie)
  const roll = useLudo((s) => s.roll)
  const clickToken = useLudo((s) => s.clickToken)
  const selectDie = useLudo((s) => s.selectDie)
  const autoPlay = useLudo((s) => s.autoPlay)
  const leaveGame = useLudo((s) => s.leaveGame)
  const sendEmote = useLudo((s) => s.sendEmote)
  const sendChat = useLudo((s) => s.sendChat)
  const chat = useLudo((s) => s.chat)
  const chatOpen = useLudo((s) => s.chatOpen)
  const setChatOpen = useLudo((s) => s.setChatOpen)
  const emotes = useLudo((s) => s.emotes)
  const floatMsgs = useLudo((s) => s.floatMsgs)
  const winData = useLudo((s) => s.winData)
  const soundOn = useLudo((s) => s.soundOn)
  const toggleSound = useLudo((s) => s.toggleSound)
  const turnDeadline = useLudo((s) => s.turnDeadline)
  const gameRef = useRef<HTMLDivElement | null>(null)

  const [now, setNow] = useState(Date.now())
  const lastChatCount = useRef(0)
  const [unread, setUnread] = useState(0)

  // clock tick for timer
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  // unread chat badge
  useEffect(() => {
    if (chat.length > lastChatCount.current) {
      if (!chatOpen) setUnread((u) => Math.min(99, u + chat.length - lastChatCount.current))
    }
    lastChatCount.current = chat.length
  }, [chat, chatOpen])

  useEffect(() => {
    if (chatOpen) setUnread(0)
  }, [chatOpen])

  // turn timeout -> auto play
  useEffect(() => {
    if (!turnDeadline || !game || winData) return
    if (now < turnDeadline) return
    void autoPlay()
  }, [now, turnDeadline, game, winData, autoPlay])

  // emotes expire
  const [nowEmote, setNowEmote] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setNowEmote(Date.now()), 300)
    return () => clearInterval(t)
  }, [])

  const visibleEmotes = useMemo(() => emotes.filter((e) => Date.now() - e.id < 9000000), [emotes, nowEmote])

  if (!game || !session) return null

  const turnColor = game.players[game.turn].color
  const youTurn = !game.players[game.turn].isBot && turnColor === session.youColor
  const remainingSec = turnDeadline ? Math.ceil((turnDeadline - now) / 1000) : null

  const cardData = (i: number): PlayerCardData | null => {
    const p = game.players[i]
    if (!p) return null
    return {
      color: p.color,
      name: p.name,
      avatar: p.avatar,
      isBot: p.isBot,
      isTurn: game.turn === i && game.phase !== 'gameover',
      tokensHome: p.tokens.filter((t) => t.location === 'home').length,
      tokensFinished: p.tokens.filter((t) => t.location === 'finished').length,
      captured: 0,
      connected: p.connected,
    }
  }

  // split players: left column gets first ceil half, right column the rest
  const nPlayers = game.players.length
  const leftCount = Math.ceil(nPlayers / 2)
  const leftIdx = Array.from({ length: leftCount }, (_, i) => i)
  const rightIdx = Array.from({ length: nPlayers - leftCount }, (_, i) => leftCount + i)

  const emoteFor = (color: string) => {
    const latest = [...visibleEmotes].reverse().find((e) => e.color === color)
    return latest ? { id: latest.id, emoji: latest.emoji } : null
  }

  const turnName = game.players[game.turn].name

  return (
    <div ref={gameRef} className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-2 pb-3 pt-2 sm:px-4">
      {/* top bar */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={leaveGame}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-900/80 text-slate-300 ring-1 ring-slate-600 transition hover:bg-red-900/60 hover:text-white"
            aria-label="Leave game"
          >
            <LogOut size={16} />
          </button>
          <div className="rounded-full bg-slate-900/80 px-3 py-1.5 text-[11px] font-bold text-slate-300 ring-1 ring-slate-600">
            {MODE_LABELS[session.mode]} · {session.online ? `Room ${session.roomCode}` : session.online ? '' : 'Offline'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1.5 ring-1 ring-amber-500/50">
            <span className="text-sm">🪙</span>
            <span className="text-xs font-black text-amber-400">{profile.coins.toLocaleString()}</span>
            <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-300">pot {session.pot.toLocaleString()}</span>
          </div>
          <button
            onClick={toggleSound}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-900/80 text-slate-300 ring-1 ring-slate-600 transition hover:bg-slate-800"
            aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* floating messages */}
      <div className="pointer-events-none absolute left-1/2 top-14 z-40 flex -translate-x-1/2 flex-col items-center gap-1">
        <AnimatePresence>
          {floatMsgs.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: -8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="rounded-full px-4 py-1.5 text-xs font-bold shadow-lg"
              style={{
                background:
                  m.kind === 'capture'
                    ? 'linear-gradient(140deg,#dc2626,#991b1b)'
                    : m.kind === 'six'
                      ? 'linear-gradient(140deg,#f59e0b,#b45309)'
                      : m.kind === 'forfeit'
                        ? 'linear-gradient(140deg,#7f1d1d,#450a0a)'
                        : 'rgba(15,23,42,0.92)',
                color: '#fff',
                border: '1px solid rgba(148,163,184,0.4)',
              }}
            >
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* main layout: players around board */}
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        {/* player strip (mobile-friendly: always visible, wraps on desktop to sides) */}
        <div className="grid w-full max-w-2xl grid-cols-2 gap-1.5 sm:gap-2 md:hidden">
          {game.players.map((p, i) => (
            <PlayerCard key={p.color} player={cardData(i)!} compact remainingSec={game.turn === i ? remainingSec : null} emote={emoteFor(p.color)} />
          ))}
        </div>

        <div className="hidden w-full items-start justify-center gap-3 md:flex">
          <div className="flex flex-col gap-2">
            {leftIdx.map((i) => (
              <PlayerCard key={game.players[i].color} player={cardData(i)!} remainingSec={game.turn === i ? remainingSec : null} emote={emoteFor(game.players[i].color)} />
            ))}
          </div>

          <Board
            game={game}
            movableTokenIds={movableTokenIds}
            onTokenClick={(id) => void clickToken(id)}
            youColor={session.youColor}
            animating={animating}
            emotes={[]}
          />

          <div className="flex flex-col gap-2">
            {rightIdx.map((i) => (
              <PlayerCard key={game.players[i].color} player={cardData(i)!} remainingSec={game.turn === i ? remainingSec : null} emote={emoteFor(game.players[i].color)} />
            ))}
          </div>
        </div>

        {/* board on mobile */}
        <div className="w-full md:hidden">
          <Board
            game={game}
            movableTokenIds={movableTokenIds}
            onTokenClick={(id) => void clickToken(id)}
            youColor={session.youColor}
            animating={animating}
            emotes={[]}
          />
        </div>

        {/* dice + emotes */}
        <div className="mt-1 flex items-center gap-3">
          <DiceTray
            values={canRoll && game.phase === 'roll' ? [] : diceValues.length > 0 ? diceValues : game.dice}
            color={turnColor}
            rolling={diceRolling}
            usedDice={game.usedDice}
            selectedDie={selectedDie}
            onSelectDie={selectDie}
            onRoll={() => void roll()}
            canRoll={canRoll && !animating && !diceRolling}
            playerName={turnName}
            isYou={youTurn}
          />
          <EmoteBar onEmote={sendEmote} onOpenChat={() => setChatOpen(!chatOpen)} unread={unread} />
        </div>

        {/* turn hint */}
        <div className="h-5 text-center text-[11px] font-semibold" style={{ color: COLOR_HEX[turnColor]?.light }}>
          {game.phase === 'gameover'
            ? 'Game over'
            : diceRolling
              ? 'Rolling...'
              : youTurn
                ? game.phase === 'roll'
                  ? 'Tap the dice to roll'
                  : movableTokenIds.length > 0
                    ? 'Tap a glowing token to move'
                    : '...'
                : `${turnName}'s turn${game.players[game.turn].isBot ? ' (bot)' : ''}`}
        </div>
        {game.mode === 'master' && game.dice.length > 1 && (
          <div className="text-center text-[10px] text-slate-400">Master mode: use both dice · tap a die to switch</div>
        )}
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} chat={chat} onSend={sendChat} youColor={session.youColor} />

      <AnimatePresence>
        {winData && (
          <WinOverlay win={winData} isOnline={session.online} />
        )}
      </AnimatePresence>
    </div>
  )
}

// re-export for potential external timer use
export { TURN_SECONDS }
