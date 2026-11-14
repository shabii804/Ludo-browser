'use client'

// Emote bar + quick chat + chat panel (Ludo Star style)

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Smile, X } from 'lucide-react'
import { CHAT_QUICK, EMOTES } from '@/lib/ludo/constants'
import type { Color } from '@/lib/ludo/types'
import { COLOR_HEX } from '@/lib/ludo/board'

export function EmoteBar({
  onEmote,
  onOpenChat,
  unread,
}: {
  onEmote: (emoji: string) => void
  onOpenChat: () => void
  unread: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex items-center gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.85 }}
            className="absolute bottom-12 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-900/95 px-3 py-2 shadow-2xl ring-1 ring-slate-600"
          >
            <div className="grid grid-cols-6 gap-1">
              {EMOTES.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    onEmote(e)
                    setOpen(false)
                  }}
                  className="grid h-9 w-9 place-items-center rounded-xl text-xl transition hover:scale-110 hover:bg-slate-700"
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="mt-1.5 border-t border-slate-700 pt-1.5">
              <div className="flex flex-wrap gap-1">
                {CHAT_QUICK.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      sendQuick(q, onEmote)
                      setOpen(false)
                    }}
                    className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-200 ring-1 ring-slate-600 transition hover:bg-slate-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center rounded-full text-xl transition hover:scale-110"
        style={{ background: 'rgba(15,23,42,0.8)', border: '1.5px solid rgba(100,116,139,0.5)' }}
        aria-label="Send emote"
      >
        <Smile size={20} className="text-amber-300" />
      </button>
      <button
        onClick={onOpenChat}
        className="relative grid h-10 w-10 place-items-center rounded-full transition hover:scale-110"
        style={{ background: 'rgba(15,23,42,0.8)', border: '1.5px solid rgba(100,116,139,0.5)' }}
        aria-label="Open chat"
      >
        <MessageCircle size={18} className="text-amber-300" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
    </div>
  )
}

function sendQuick(text: string, onEmote: (emoji: string) => void) {
  // quick chats ride on the emote channel as text bubbles
  onEmote(text)
}

export function ChatPanel({
  open,
  onClose,
  chat,
  onSend,
  youColor,
}: {
  open: boolean
  onClose: () => void
  chat: Array<{ id: number; color: Color; name: string; text: string; ts: number }>
  onSend: (text: string) => void
  youColor: Color
}) {
  const [text, setText] = useState('')
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-4 left-4 z-50 w-72 rounded-2xl bg-slate-900/95 shadow-2xl ring-1 ring-slate-600"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
            <span className="text-xs font-bold text-slate-200">Table chat</span>
            <button onClick={onClose} aria-label="Close chat" className="text-slate-400 hover:text-white">
              <X size={15} />
            </button>
          </div>
          <div className="max-h-44 space-y-1.5 overflow-y-auto px-3 py-2">
            {chat.length === 0 && <p className="py-6 text-center text-[11px] text-slate-500">No messages yet. Say hi!</p>}
            {chat.map((m) => (
              <div key={m.id} className="flex items-start gap-1.5 text-[11px]">
                <span
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: COLOR_HEX[m.color]?.main ?? '#94a3b8' }}
                />
                <span className="font-bold" style={{ color: COLOR_HEX[m.color]?.light ?? '#e2e8f0' }}>
                  {m.name}:
                </span>
                <span className="text-slate-300">{m.text}</span>
              </div>
            ))}
          </div>
          <form
            className="flex gap-1.5 border-t border-slate-700 p-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!text.trim()) return
              onSend(text)
              setText('')
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              maxLength={120}
              className="min-w-0 flex-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-slate-900 transition hover:bg-amber-400"
            >
              Send
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
