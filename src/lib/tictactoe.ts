/**
 * tictactoe.ts — Pure game logic for the Tic-Tac-Toe mini-game.
 * No React, no side-effects. Importable and unit-testable in isolation.
 */

export type Cell = 'X' | 'O' | null
export type Board = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell]
export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameResult = 'X' | 'O' | 'draw' | null

export const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const

export function emptyBoard(): Board {
  return [null, null, null, null, null, null, null, null, null]
}

export function checkWinner(board: Board): GameResult {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as 'X' | 'O'
    }
  }
  if (board.every(c => c !== null)) return 'draw'
  return null
}

export function getWinningLine(board: Board): readonly [number, number, number] | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line
    }
  }
  return null
}

/** Minimax — returns score from O's perspective: +10 O wins, -10 X wins, 0 draw. */
function minimax(board: Board, isMaximizing: boolean, depth: number): number {
  const result = checkWinner(board)
  if (result === 'O') return 10 - depth
  if (result === 'X') return depth - 10
  if (result === 'draw') return 0

  if (isMaximizing) {
    let best = -Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O'
        best = Math.max(best, minimax(board, false, depth + 1))
        board[i] = null
      }
    }
    return best
  } else {
    let best = Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X'
        best = Math.min(best, minimax(board, true, depth + 1))
        board[i] = null
      }
    }
    return best
  }
}

function getBestMove(board: Board): number {
  let bestVal = -Infinity
  let bestMove = -1
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = 'O'
      const val = minimax(board, false, 0)
      board[i] = null
      if (val > bestVal) {
        bestVal = val
        bestMove = i
      }
    }
  }
  return bestMove
}

function getRandomMove(board: Board): number {
  const empty = board.map((c, i) => (c === null ? i : -1)).filter(i => i !== -1)
  return empty[Math.floor(Math.random() * empty.length)]
}

/** Returns the mummy's chosen cell index given the current board and difficulty. */
export function getMummyMove(board: Board, difficulty: Difficulty): number {
  const roll = Math.random()

  if (difficulty === 'hard') {
    return getBestMove(board)
  }

  if (difficulty === 'medium') {
    // 65% best move, 35% random — beatable but not trivial
    return roll < 0.65 ? getBestMove(board) : getRandomMove(board)
  }

  // easy: fully random
  return getRandomMove(board)
}

// ── Stats ────────────────────────────────────────────────────────────────────

export interface TTTStats {
  wins: number
  losses: number
  draws: number
  bestWinStreak: number
  currentWinStreak: number
}

function storageKey(difficulty: Difficulty): string {
  return `ttt_stats_${difficulty}`
}

export function loadStats(difficulty: Difficulty): TTTStats {
  try {
    const raw = localStorage.getItem(storageKey(difficulty))
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TTTStats>
      return {
        wins: parsed.wins ?? 0,
        losses: parsed.losses ?? 0,
        draws: parsed.draws ?? 0,
        bestWinStreak: parsed.bestWinStreak ?? 0,
        currentWinStreak: parsed.currentWinStreak ?? 0,
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return { wins: 0, losses: 0, draws: 0, bestWinStreak: 0, currentWinStreak: 0 }
}

export function saveStats(difficulty: Difficulty, stats: TTTStats): void {
  try {
    localStorage.setItem(storageKey(difficulty), JSON.stringify(stats))
  } catch {
    // ignore storage errors
  }
}

export function updateStats(difficulty: Difficulty, result: GameResult): TTTStats {
  const stats = loadStats(difficulty)
  if (result === 'X') {
    stats.wins++
    stats.currentWinStreak++
    if (stats.currentWinStreak > stats.bestWinStreak) {
      stats.bestWinStreak = stats.currentWinStreak
    }
  } else if (result === 'O') {
    stats.losses++
    stats.currentWinStreak = 0
  } else if (result === 'draw') {
    stats.draws++
    stats.currentWinStreak = 0
  }
  saveStats(difficulty, stats)
  return stats
}

// ── Flavour text ─────────────────────────────────────────────────────────────

export const MUMMY_TAUNTS = [
  "You dare challenge me? I've had 3,000 years to practice...",
  "Hmm. Another mortal who thinks they can outwit me. How adorable.",
  "I was playing strategy games when your ancestors were inventing the wheel.",
  "Bold of you to challenge an ancient pharaoh to battle. Very bold.",
  "The last visitor who tried this... well, they are no longer visiting.",
  "Very well. But do not weep when you lose — it is undignified.",
]

export function randomTaunt(): string {
  return MUMMY_TAUNTS[Math.floor(Math.random() * MUMMY_TAUNTS.length)]
}

export function resultComment(result: GameResult, difficulty: Difficulty): string {
  if (result === 'X') {
    if (difficulty === 'hard') return 'IMPOSSIBLE! No mortal has beaten me in millennia! ...I demand a rematch.'
    if (difficulty === 'medium') return 'Impressive. You got lucky. Do not celebrate yet.'
    return 'Congratulations... on defeating the version of me that was napping.'
  }
  if (result === 'O') {
    return 'As expected. I am eternal. You are... temporary.'
  }
  return 'Hmm. You are... adequate. For a mortal.'
}
