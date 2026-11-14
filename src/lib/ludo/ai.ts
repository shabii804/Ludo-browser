// ============================================================
// Ludo AI Bot - heuristic opponent (Ludo Star "Computer" style)
// Priorities: finish > capture > escape danger > open > progress
// ============================================================

import type { GameState, Move, Token } from './types'
import { legalMoves, tokenProgress } from './engine'
import { SAFE_IDX, START_IDX, trackIdxFor, TRACK } from './board'

/**
 * How exposed is a cell to being captured? Counts enemy tokens that
 * can reach `trackIdx` within 1..6 steps from behind.
 */
function dangerAt(state: GameState, color: Token['color'], trackIdx: number): number {
  if (SAFE_IDX.has(trackIdx)) return 0
  let danger = 0
  for (const p of state.players) {
    if (p.color === color) continue
    for (const t of p.tokens) {
      if (t.location !== 'track') continue
      const start = START_IDX[p.color]
      const myProgress = (trackIdx - start + 52) % 52 // if enemy stood on this cell
      for (let d = 1; d <= 6; d++) {
        const from = (myProgress - d + 52) % 52
        const enemyProgress = (t.trackIdx - start + 52) % 52
        if (enemyProgress === from) {
          danger += 1
          break
        }
      }
    }
  }
  return danger
}

function moveScore(state: GameState, move: Move): number {
  const player = state.players[state.turn]
  const token = player.tokens[move.tokenId]
  let score = 0

  // 1. finishing a token is huge
  if (move.finishes) score += 120

  // 2. capturing: value the captured token by how far it had traveled
  if (move.captures.length > 0) {
    for (const p of state.players) {
      if (p.color === player.color) continue
      for (const t of p.tokens) {
        if (t.location === 'track' && move.captures.includes(t.id)) {
          score += 60 + t.progress * 0.5
        }
      }
    }
  }

  // 3. opening a new token when few are on the board
  if (move.opens) {
    const onBoard = player.tokens.filter((t) => t.location === 'track' || t.location === 'home').length
    score += onBoard === 0 ? 90 : onBoard === 1 ? 55 : 18
  }

  // 4. entering the home lane (safety)
  if (move.entersHome) score += 35

  // 5. escaping danger (current cell threatened)
  if (move.from.location === 'track') {
    const fromDanger = dangerAt(state, player.color, move.from.trackIdx)
    score += fromDanger * 14
  }

  // 6. landing on a safe cell
  if (move.landsSafe && move.to.location === 'track') score += 16

  // 7. avoid landing in danger
  if (move.to.location === 'track') {
    const toDanger = dangerAt(state, player.color, move.to.trackIdx)
    score -= toDanger * 22
    // landing just ahead of own token chain is slightly good (blocking-ish)
  }

  // 8. prefer advancing the leading token, small bonus for progress
  if (move.to.location === 'track' || move.entersHome) {
    score += move.to.location === 'home' ? move.to.homeStep * 6 : 4
  }

  // 9. mild preference to keep tokens spread: tiny random jitter
  score += Math.random() * 6

  // 10. hard difficulty: don't pass tokens that could be captured next turn
  if (move.to.location === 'track' && !move.landsSafe) {
    const enemiesBehind = dangerAt(state, player.color, move.to.trackIdx)
    if (enemiesBehind === 0) {
      // cell is currently unreachable by enemies — decent spot
      score += 6
    }
  }

  void token
  return score
}

/** Pick the best move for the current player (assumes phase === 'move'). */
export function botChooseMove(state: GameState): Move | null {
  const moves = legalMoves(state)
  if (moves.length === 0) return null

  // group by die so master mode uses both dice naturally
  let best: Move | null = null
  let bestScore = -Infinity
  for (const m of moves) {
    const s = moveScore(state, m)
    if (s > bestScore) {
      bestScore = s
      best = m
    }
  }
  return best
}

/** Path cells (loop indices) a color still has to walk — used for hints. */
export function remainingSteps(state: GameState, color: Token['color']): number {
  const p = state.players.find((pl) => pl.color === color)
  if (!p) return 0
  let total = 0
  for (const t of p.tokens) {
    const prog = tokenProgress(t)
    total += prog < 0 ? 63 : 56 - prog
  }
  return total
}

void TRACK
void trackIdxFor
