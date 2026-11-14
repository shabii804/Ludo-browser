// ============================================================
// Game constants: avatars, emotes, stakes, table names
// ============================================================

export const AVATARS = [
  '🦁', '🐼', '🦊', '🐸', '🐯', '🐵', '🦄', '🐲',
  '🐧', '🦅', '🐺', '🦈', '🐨', '🐷', '🐰', '🤖',
] as const

export const EMOTES = ['😂', '😱', '😡', '👏', '😭', '😎', '🔥', '💛', '🤝', '😈', '🍀', '💥'] as const

export const CHAT_QUICK = [
  'Well played!',
  'Ouch!',
  'Lucky roll!',
  "I'm back!",
  'Fastest dice in town 😎',
  'Better luck next time!',
  'Nice capture!',
  'So close...',
] as const

export const STAKES = [50, 100, 500, 1000] as const

export const STARTING_COINS = 5000

export const FREE_REFILL = 5000

export const MODE_LABELS: Record<string, string> = {
  classic: 'Classic',
  quick: 'Quick',
  master: 'Master',
}

export const MODE_DESC: Record<string, string> = {
  classic: '4 tokens · 1 die · the timeless game',
  quick: '2 tokens · 1 die · fast battles',
  master: '4 tokens · 2 dice · pro tables',
}

export const TURN_SECONDS = 15

export const TABLE_THEMES = [
  { name: 'Emerald Club', bg: 'from-emerald-950 via-emerald-900 to-slate-950', felt: '#0b3d2e' },
  { name: 'Royal Navy', bg: 'from-slate-950 via-blue-950 to-slate-900', felt: '#0f172a' },
  { name: 'Ruby Lounge', bg: 'from-rose-950 via-red-950 to-slate-950', felt: '#3f0d1a' },
] as const
