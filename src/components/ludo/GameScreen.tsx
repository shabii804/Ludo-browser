'use client'

// Game screen: premium navy table — glass top bar, board with
// center dice, player cards around, emotes, chat, timer.
// All game logic & handlers preserved.

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Timer, Volume2, VolumeX } from 'lucide-react'
import Board from '@/components/ludo/Board'
import PlayerCard, { type PlayerCardData } from '@/components/ludo/PlayerCard'
import { ChatPanel, EmoteBar } from '@/components/ludo/EmoteBar'
import WinOverlay from '@/components/ludo/WinOverlay'
import { useLudo } from '@/stores/ludoStore'
import { COLOR_HEX } from '@/lib/ludo/board'
import { MODE_LABELS, TURN_SECONDS } from '@/lib/ludo/constants'
import { CoinIcon } from '@/components/ludo/ui'

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
    void autoPlay(true)
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
  // dice shows TAP state when you can roll, otherwise last rolled value(s)
  const displayDice = canRoll && game.phase === 'roll' ? [] : diceValues.length > 0 ? diceValues : game.dice

  return (
    <div className="ls-felt relative min-h-screen">
      <div className="ls-vignette" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-2 pb-3 pt-2 sm:px-4">
        {/* top bar */}
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={leaveGame}
              className="ls-panel grid h-9 w-9 place-items-center rounded-full text-indigo-200 transition hover:text-white"
              aria-label="Leave game"
            >
              <LogOut size={16} />
            </button>
            <div className="ls-panel rounded-full px-3 py-1.5 text-[11px] font-bold text-indigo-100">
              {MODE_LABELS[session.mode].toUpperCase()}
              {session.online ? ` · ROOM ${session.roomCode}` : ' · OFFLINE'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="ls-panel flex items-center gap-1.5 rounded-full px-3 py-1.5">
              <CoinIcon size={15} />
              <span className="ls-font text-xs text-amber-200">{profile.coins.toLocaleString()}</span>
              <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-300">
                pot {session.pot.toLocaleString()}
              </span>
            </div>
            <button
              onClick={toggleSound}
              className="ls-panel grid h-9 w-9 place-items-center rounded-full text-indigo-200 transition hover:text-white"
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
                className="ls-font rounded-full px-4 py-1.5 text-xs text-white shadow-lg"
                style={{
                  background:
                    m.kind === 'capture'
                      ? 'linear-gradient(180deg,#f4695f,#b02820)'
                      : m.kind === 'six'
                        ? 'linear-gradient(180deg,#ffe08a,#e09b1a)'
                        : m.kind === 'forfeit'
                          ? 'linear-gradient(180deg,#7f1d1d,#450a0a)'
                          : 'linear-gradient(180deg,#3b3f75,#22254e)',
                  border: '2px solid rgba(196,181,253,0.7)',
                  textShadow: '0 1px 0 rgba(10,6,30,0.6)',
                }}
              >
                {m.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* main layout: players around board */}
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          {/* player strip (mobile) */}
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
              diceValues={displayDice}
              diceRolling={diceRolling}
              canRoll={canRoll}
              onRoll={() => void roll()}
              selectedDie={selectedDie}
              onSelectDie={selectDie}
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
              diceValues={displayDice}
              diceRolling={diceRolling}
              canRoll={canRoll}
              onRoll={() => void roll()}
              selectedDie={selectedDie}
              onSelectDie={selectDie}
            />
          </div>

          {/* emotes + hints */}
          <div className="mt-1 flex items-center gap-3">
            <EmoteBar onEmote={sendEmote} onOpenChat={() => setChatOpen(!chatOpen)} unread={unread} />
          </div>

          {/* turn countdown + hint */}
          {youTurn && remainingSec !== null && game.phase !== 'gameover' && (
            <motion.div
              key={turnDeadline ?? 0}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 flex w-full max-w-[320px] flex-col items-center gap-1"
            >
              <div className="flex items-center gap-1.5">
                <Timer size={13} style={{ color: remainingSec <= 3 ? '#fb7185' : '#ffd23e' }} />
                <span
                  className="ls-font text-sm leading-none"
                  style={{ color: remainingSec <= 3 ? '#fb7185' : '#ffe9b0' }}
                >
                  {remainingSec}s TO PLAY
                </span>
                {remainingSec <= 3 && (
                  <motion.span
                    animate={{ opacity: [1, 0.35, 1], scale: [1, 1.12, 1] }}
                    transition={{ repeat: Infinity, duration: 0.7 }}
                    className="ls-font rounded-full px-2 py-0.5 text-[10px] leading-none text-white"
                    style={{ background: 'linear-gradient(180deg,#f4695f,#b02820)' }}
                  >
                    AUTO
                  </motion.span>
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(1, (turnDeadline ? (turnDeadline - now) / (TURN_SECONDS * 1000) : 0)) * 100)}%`,
                    background: remainingSec <= 3
                      ? 'linear-gradient(90deg,#f4695f,#b02820)'
                      : 'linear-gradient(90deg,#ffe08a,#f0a10c)',
                    boxShadow: remainingSec <= 3 ? '0 0 8px rgba(244,105,95,0.7)' : '0 0 8px rgba(240,161,12,0.5)',
                  }}
                />
              </div>
            </motion.div>
          )}
          <div className="ls-font h-6 text-center text-xs tracking-wide" style={{ color: COLOR_HEX[turnColor]?.light }}>
            {game.phase === 'gameover'
              ? 'GAME OVER'
              : diceRolling
                ? 'ROLLING...'
                : youTurn
                  ? game.phase === 'roll'
                    ? 'TAP THE DICE TO ROLL'
                    : movableTokenIds.length > 0
                      ? 'TAP A GLOWING TOKEN TO MOVE'
                      : '...'
                  : `${turnName.toUpperCase()}'S TURN${game.players[game.turn].isBot ? ' (BOT)' : ''}`}
          </div>
          {game.mode === 'master' && game.dice.length > 1 && (
            <div className="text-center text-[10px] text-indigo-300/50">Master mode: use both dice · tap a die to switch</div>
          )}
        </div>

        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} chat={chat} onSend={sendChat} youColor={session.youColor} />

        <AnimatePresence>
          {winData && (
            <WinOverlay win={winData} isOnline={session.online} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// re-export for potential external timer use
export { TURN_SECONDS }
