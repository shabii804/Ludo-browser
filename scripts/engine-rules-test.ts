// Engine rule verification: extra turn on 6, capture/finish extra turn,
// turn order rotation, three-six forfeit, zero-crash over many games.
import {
  applyMove,
  createGame,
  legalMoves,
  passTurn,
  rollDice,
} from '../src/lib/ludo/engine'
import type { GameState, Move } from '../src/lib/ludo/types'

let failures = 0
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++
    console.log('FAIL:', name)
  }
}

// Deterministic dice rig
function rig(seq: number[]) {
  let i = 0
  return () => {
    const v = seq[i % seq.length]
    i++
    return (v - 1) / 6 // rollDice does DICE_MIN + floor(rand*6)
  }
}

// ---- Test 1: extra turn on six (same player rolls again) ----
{
  const g = createGame({
    mode: 'classic',
    players: [
      { color: 'red', name: 'A', avatar: 'x', isBot: false },
      { color: 'yellow', name: 'B', avatar: 'y', isBot: false },
    ],
  })
  const { state: s1 } = rollDice(g, rig([6]))
  check('T1 six -> phase move', s1.phase === 'move')
  const moves = legalMoves(s1)
  check('T1 six opens token', moves.length === 4 && moves.every((m) => m.opens))
  const s2 = applyMove(s1, moves[0])
  check('T1 after moving with six, same player rolls again', s2.phase === 'roll' && s2.turn === 0)
  const { state: s3 } = rollDice(s2, rig([3]))
  check('T1 non-six -> next player', (() => {
    const m2 = legalMoves(s3)
    const s4 = m2.length ? applyMove(s3, m2[0]) : passTurn(s3)
    return s4.turn === 1 && s4.phase === 'roll'
  })())
}

// ---- Test 2: capture grants extra turn ----
{
  const g = createGame({
    mode: 'classic',
    players: [
      { color: 'red', name: 'A', avatar: 'x', isBot: false },
      { color: 'green', name: 'B', avatar: 'y', isBot: false },
    ],
  })
  // open red token (six), then six again -> land on progress 6? start=1 -> trackIdx 7... 
  // Simpler: walk red out, then advance to green's start cell (progress 13 -> abs 14) captures green opening later.
  let s = g
  const r = rig([6])
  ;({ state: s } = rollDice(s, r))
  s = applyMove(s, legalMoves(s)[0]) // red opens (progress 0), six => extra turn
  check('T2 red opened', s.players[0].tokens[0].location === 'track')
  // red walks 6+6+2 = progress 14 -> abs (1+14)%52 = 15 (NOT safe), one step past green's start
  ;({ state: s } = rollDice(s, rig([6])))
  s = applyMove(s, legalMoves(s).find((m) => m.tokenId === 0)!) // progress 6, extra turn
  ;({ state: s } = rollDice(s, rig([6])))
  s = applyMove(s, legalMoves(s).find((m) => m.tokenId === 0)!) // progress 12, extra turn
  ;({ state: s } = rollDice(s, rig([2])))
  const mv = legalMoves(s).find((m) => m.tokenId === 0)!
  s = applyMove(s, mv) // progress 14 -> abs 15, non-six passes turn
  check('T2 after non-six it is green turn', s.turn === 1)
  // green rolls 6, opens on its start (abs 14, safe) -> extra turn; then 1 -> lands abs 15 -> captures red
  ;({ state: s } = rollDice(s, rig([6])))
  const gmv = legalMoves(s).find((m) => m.opens)!
  check('T2 green opens without capture (start is safe)', gmv.captures.length === 0)
  s = applyMove(s, gmv)
  check('T2 green got extra turn from six', s.turn === 1 && s.phase === 'roll')
  ;({ state: s } = rollDice(s, rig([1])))
  const gmv2 = legalMoves(s).find((m) => m.tokenId === 0)!
  check('T2 green capture available', gmv2.captures.length === 1)
  s = applyMove(s, gmv2)
  check('T2 capture sends red home', s.players[0].tokens[0].location === 'yard')
  check('T2 capture grants green extra turn', s.turn === 1 && s.phase === 'roll')
}

// ---- Test 3: turn order cycles red -> green -> yellow -> blue (4P) ----
{
  const g = createGame({
    mode: 'classic',
    players: [
      { color: 'red', name: 'A', avatar: 'x', isBot: false },
      { color: 'green', name: 'B', avatar: 'y', isBot: false },
      { color: 'yellow', name: 'C', avatar: 'z', isBot: false },
      { color: 'blue', name: 'D', avatar: 'w', isBot: false },
    ],
  })
  let s = g
  for (let i = 0; i < 8; i++) {
    ;({ state: s } = rollDice(s, rig([2])))
    const mv: Move | undefined = legalMoves(s)[0]
    s = mv ? applyMove(s, mv) : passTurn(s)
  }
  const seq: number[] = []
  let t = s.turn
  // just check passTurn cycles without sixes
  const order: number[] = []
  let cur = passTurn(s)
  for (let i = 0; i < 4; i++) {
    order.push(cur.turn)
    cur = passTurn(cur)
  }
  check('T3 order cycles all four seats', new Set(order).size === 4)
  void t
  void seq
}

// ---- Test 4: three consecutive sixes forfeit ----
{
  const g = createGame({
    mode: 'classic',
    players: [
      { color: 'red', name: 'A', avatar: 'x', isBot: false },
      { color: 'yellow', name: 'B', avatar: 'y', isBot: false },
    ],
  })
  let s = g
  let ff = false
  // tokens all in yard: rolling 6 then moving keeps opening; we roll 6 three times but DO move each time
  // three sixes with moves between -> third six still forfeits (streak counts rolls, not moves)
  ;({ state: s, forfeited: ff } = rollDice(s, rig([6])))
  check('T4 first six not forfeit', !ff)
  s = applyMove(s, legalMoves(s)[0])
  ;({ state: s, forfeited: ff } = rollDice(s, rig([6])))
  check('T4 second six not forfeit', !ff)
  s = applyMove(s, legalMoves(s)[0])
  const res = rollDice(s, rig([6]))
  check('T4 third six forfeits', res.forfeited)
  const passed = passTurn(res.state)
  check('T4 forfeit passes turn', passed.turn === 1)
}

// ---- Test 5: stress — 300 random games, no crash, valid invariants ----
{
  let extraTurnOnSix = 0
  let sixRolls = 0
  for (let game = 0; game < 300; game++) {
    const seedN = (game * 7919) % 1000
    let s = createGame({
      mode: game % 3 === 0 ? 'quick' : 'classic',
      players: [
        { color: 'red', name: 'A', avatar: 'x', isBot: false },
        { color: 'yellow', name: 'B', avatar: 'y', isBot: false },
      ],
    })
    let guard = 0
    let prevTurn = s.turn
    let prevPhase: string = s.phase
    while (s.phase !== 'gameover' && guard++ < 20000) {
      if (s.phase === 'roll') {
        const val = ((game * 31 + guard * 17 + seedN) % 6) + 1
        prevTurn = s.turn
        prevPhase = 'roll'
        const { state, forfeited } = rollDice(s, rig([val]))
        s = forfeited ? passTurn(state) : state
        if (val === 6 && !forfeited) {
          sixRolls++
          // after the move resolves (next time we leave phase 'move'), same player should roll again
          // we detect right after applyMove below
        }
      } else if (s.phase === 'move') {
        const mvs = legalMoves(s)
        if (mvs.length === 0) s = passTurn(s)
        else {
          const m = mvs[guard % mvs.length]
          const wasSix = s.dice[m.dieIndex] === 6
          const mover = s.turn
          s = applyMove(s, m)
          if (wasSix && s.phase === 'roll' && s.turn === mover) extraTurnOnSix++
          if (wasSix && s.phase !== 'gameover' && s.turn !== mover) {
            failures++
            console.log('FAIL: six did not grant extra turn (game', game, 'step', guard, ')')
          }
        }
      }
      // invariants
      if (s.turn < 0 || s.turn >= s.players.length) {
        failures++
        console.log('FAIL: turn out of range')
        break
      }
      void prevTurn
      void prevPhase
    }
    if (s.phase !== 'gameover' && guard >= 20000) {
      failures++
      console.log('FAIL: game did not finish (stuck)')
    }
  }
  console.log('six rolls:', sixRolls, 'extra-turn-on-six confirmed:', extraTurnOnSix)
}

console.log(failures === 0 ? 'ALL ENGINE RULE TESTS PASSED' : failures + ' FAILURES')
process.exit(failures === 0 ? 0 : 1)
