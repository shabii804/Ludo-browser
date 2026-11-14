// ============================================================
// Ludo Game Engine - Types
// Shared between Next.js web app and future Expo mobile app
// ============================================================

export type Color = 'red' | 'green' | 'yellow' | 'blue'

export type GameMode = 'classic' | 'quick' | 'master'

export type TokenLocation = 'yard' | 'track' | 'home' | 'finished'

export interface Token {
  /** 0..tokensPerPlayer-1 */
  id: number
  color: Color
  location: TokenLocation
  /**
   * Absolute loop index 0..51 when on track
   */
  trackIdx: number
  /**
   * 1..5 position inside the home column when location === 'home'
   */
  homeStep: number
  /** total pips advanced since leaving yard (for tie-breaking / display) */
  progress: number
}

export interface Player {
  color: Color
  name: string
  avatar: string
  isBot: boolean
  connected?: boolean
  tokens: Token[]
}

export interface Move {
  /** token id of the moving player */
  tokenId: number
  /** which die this move uses (index into dice array; 0 for single-die modes) */
  dieIndex: number
  from: { location: TokenLocation; trackIdx: number; homeStep: number }
  to: { location: TokenLocation; trackIdx: number; homeStep: number }
  /** loop indices of captured opponent tokens */
  captures: number[]
  /** true when this move brings a token out of the yard */
  opens: boolean
  /** true when token reaches the center (finished) */
  finishes: boolean
  /** true when token enters the home column with this move */
  entersHome: boolean
  /** true when move lands on a safe cell (own or start/star) */
  landsSafe: boolean
}

export type Phase = 'roll' | 'move' | 'gameover'

export interface GameState {
  players: Player[]
  /** index into players[] whose turn it is */
  turn: number
  /** dice values currently awaiting moves (empty in phase 'roll') */
  dice: number[]
  /** which dice indices have been used (master mode) */
  usedDice: number[]
  phase: Phase
  /** consecutive sixes rolled by current player */
  sixStreak: number
  /** dice values already consumed this turn (for log / animations) */
  lastRoll: number[]
  /** true when a capture happened during the current roll (extra turn) */
  rollCaptured: boolean
  /** true when a token finished during the current roll (extra turn) */
  rollFinished: boolean
  /** true when the player rolled a third consecutive six and forfeits the turn */
  forfeited: boolean
  winner: Color | null
  mode: GameMode
  tokensPerPlayer: number
  /** moves applied this turn (for undo protection / server sync) */
  movesThisTurn: number
  /** monotonically increasing state version (sync/animation key) */
  version: number
}

export interface GameConfig {
  mode: GameMode
  /** player order: first entry moves first */
  players: Array<{ color: Color; name: string; avatar: string; isBot: boolean }>
}
