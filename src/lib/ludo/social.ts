// ============================================================
// Social layer data: in-game bot friends, leaderboard seeds,
// achievements. These are game-fiction NPCs (same universe as
// the table bots Rocky / Zuby / Lola / Kiki), not real players.
// ============================================================

export interface BotFriend {
  name: string
  avatar: string
  status: 'online' | 'in-game' | 'offline'
  level: number
  table?: string
}

export const BOT_FRIENDS: BotFriend[] = [
  { name: 'Rocky', avatar: '🦁', status: 'online', level: 12 },
  { name: 'Lola', avatar: '🦊', status: 'in-game', level: 9, table: 'Emerald Club' },
  { name: 'Zuby', avatar: '🐼', status: 'online', level: 15 },
  { name: 'Kiki', avatar: '🐸', status: 'in-game', level: 7, table: 'Ruby Lounge' },
  { name: 'Mango', avatar: '🐯', status: 'online', level: 21 },
  { name: 'Pixel', avatar: '🤖', status: 'offline', level: 11 },
  { name: 'Aurora', avatar: '🦄', status: 'online', level: 18 },
  { name: 'Draco', avatar: '🐲', status: 'offline', level: 14 },
]

export interface LeaderRow {
  name: string
  avatar: string
  wins: number
  trophies: number
  isYou?: boolean
}

/** Static rival roster; the player is inserted with their real wins. */
export const LEADERBOARD_SEED: LeaderRow[] = [
  { name: 'Mango', avatar: '🐯', wins: 148, trophies: 23 },
  { name: 'Aurora', avatar: '🦄', wins: 132, trophies: 19 },
  { name: 'Zuby', avatar: '🐼', wins: 121, trophies: 17 },
  { name: 'Rocky', avatar: '🦁', wins: 97, trophies: 12 },
  { name: 'Lola', avatar: '🦊', wins: 84, trophies: 10 },
  { name: 'Draco', avatar: '🐲', wins: 71, trophies: 8 },
  { name: 'Pixel', avatar: '🤖', wins: 63, trophies: 7 },
  { name: 'Kiki', avatar: '🐸', wins: 45, trophies: 4 },
]

export interface Achievement {
  id: string
  name: string
  desc: string
  icon: string
  /** progress from profile stats */
  progress: (s: { wins: number; losses: number; coins: number; gems: number }) => number
  goal: number
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-win', name: 'First Victory', desc: 'Win your first match', icon: '🥇', progress: (s) => s.wins, goal: 1 },
  { id: 'winner-5', name: 'Rising Star', desc: 'Win 5 matches', icon: '⭐', progress: (s) => s.wins, goal: 5 },
  { id: 'winner-10', name: 'Ludo Master', desc: 'Win 10 matches', icon: '🏆', progress: (s) => s.wins, goal: 10 },
  { id: 'rich', name: 'High Roller', desc: 'Hold 10,000 coins at once', icon: '💰', progress: (s) => s.coins, goal: 10000 },
  { id: 'veteran', name: 'Veteran', desc: 'Play 25 matches', icon: '🎯', progress: (s) => s.wins + s.losses, goal: 25 },
  { id: 'gems', name: 'Gem Hunter', desc: 'Collect 30 gems', icon: '💎', progress: (s) => s.gems, goal: 30 },
]

/** Level curve: level = 1 + floor(wins / 3); XP within level = wins % 3 of 3. */
export function levelFromWins(wins: number) {
  const level = 1 + Math.floor(wins / 3)
  const xpNow = wins % 3
  return { level, xpNow, xpNeed: 3, pct: ((xpNow / 3) * 100) }
}

export const RANK_TITLES = [
  'Rookie', 'Pawner', 'Dice Adept', 'Track Runner', 'Capture Ace',
  'Home Lane Hero', 'Six Machine', 'Board Legend', 'Ludo Royale VIP',
] as const

export function rankTitle(level: number) {
  return RANK_TITLES[Math.min(RANK_TITLES.length - 1, Math.floor((level - 1) / 2))]
}
