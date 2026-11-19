'use client'

// GameScreen — clean, pure-Ludo table (Ludo Star style):
// minimal top bar (exit + sound), board with profile avatars in
// the four yards and the dice in the turn player's corner,
// floating sticker/chat buttons, one clear status line.
// PHONE-FORMAT column (max-w-[430px]) identical on desktop &
// mobile — fixed viewport, no page scroll.
// All game logic & handlers preserved.

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Volume2, VolumeX } from 'lucide-react'
import Board from '@/components/ludo/Board'
import { ChatPanel, EmoteBar } from '@/components/ludo/EmoteBar'
import WinOverlay from '@/components/ludo/WinOverlay'
import { useLudo } from '@/stores/ludoStore'
import { COLOR_HEX } from '@/lib/ludo/board'
import { TURN_SECONDS } from '@/lib/ludo/constants'
import type { Color } from '@/lib/ludo/types'

export default function GameScreen() {
  const game = useLudo((s) => s.game)
  const session = useLudo((s) => s.session)
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

  const visibleEmotes = useMemo(
    () => emotes.filter((e) => Date.now() - e.ts < 4200),
    [emotes, nowEmote]
  )

  if (!game || !session) return null

  const turnColor = game.players[game.turn].color
  const turnPlayer = game.players[game.turn]
  const youTurn = !turnPlayer.isBot && turnColor === session.youColor
  const remainingSec = turnDeadline ? Math.min(TURN_SECONDS, Math.max(0, Math.ceil((turnDeadline - now) / 1000))) : null

  /** who may tap tokens on this device: pass-n-play hands control to each human seat in turn */
  const interactiveColor: Color | null = session.online
    ? youTurn
      ? session.youColor
      : null
    : !turnPlayer.isBot
      ? turnColor
      : null

  const turnName = turnPlayer.name
  // dice shows TAP state when you can roll, otherwise last rolled value(s)
  const displayDice = canRoll && game.phase === 'roll' ? [] : diceValues.length > 0 ? diceValues : game.dice

  return (
    <div className="ls-felt relative h-full">
      <div className="ls-vignette" />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[430px] flex-col items-center px-2.5 pb-3 pt-2">
        {/* minimal top bar: exit · sound */}
        <div className="mb-1 flex w-full items-center justify-between">
          <button
            onClick={leaveGame}
            className="ls-panel grid h-9 w-9 place-items-center rounded-full text-indigo-200 transition hover:text-white"
            aria-label="Leave game"
          >
            <LogOut size={16} />
          </button>
          <button
            onClick={toggleSound}
            className="ls-panel grid h-9 w-9 place-items-center rounded-full text-indigo-200 transition hover:text-white"
            aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        {/* floating capture / six toasts */}
        <div className="pointer-events-none absolute left-1/2 top-12 z-40 flex -translate-x-1/2 flex-col items-center gap-1">
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

        {/* the board — avatars in yards, dice in the turn corner */}
        <div className="flex w-full min-h-0 flex-1 flex-col items-center justify-center gap-2">
          <Board
            game={game}
            movableTokenIds={movableTokenIds}
            onTokenClick={(id) => void clickToken(id)}
            youColor={session.youColor}
            interactiveColor={interactiveColor}
            animating={animating}
            emotes={visibleEmotes.map((e) => ({ id: e.id, color: e.color, emoji: e.emoji }))}
            diceValues={displayDice}
            diceRolling={diceRolling}
            canRoll={canRoll}
            onRoll={() => void roll()}
            selectedDie={selectedDie}
            onSelectDie={selectDie}
            turnRemainingSec={game.phase !== 'gameover' ? remainingSec : null}
          />

          {/* sticker + chat */}
          <EmoteBar onEmote={sendEmote} onOpenChat={() => setChatOpen(!chatOpen)} unread={unread} />

          {/* one clear status line */}
          <div className="ls-font h-5 text-center text-xs tracking-wide" style={{ color: COLOR_HEX[turnColor]?.light }}>
            {game.phase === 'gameover'
              ? 'GAME OVER'
              : diceRolling
                ? 'ROLLING...'
                : canRoll && game.phase === 'roll' && game.sixStreak > 0
                  ? 'SIX! ROLL AGAIN'
                  : interactiveColor
                    ? game.phase === 'roll'
                      ? 'YOUR TURN — TAP THE DICE'
                      : movableTokenIds.length > 0
                        ? 'TAP A GLOWING TOKEN TO MOVE'
                        : '...'
                    : `${turnName.toUpperCase()}'S TURN${turnPlayer.isBot ? ' (BOT)' : ''}`}
          </div>
          {game.mode === 'master' && game.dice.length > 1 && (
            <div className="text-center text-[10px] text-indigo-300/50">Master: use both dice · tap a die to switch</div>
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
