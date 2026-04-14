/**
 * minesweeper.ts — Pure game logic for the Desert Minesweeper mini-game.
 * No React, no side-effects. All state is immutable — every mutation returns
 * a new board rather than modifying in place.
 */

export type Difficulty = 'easy' | 'medium' | 'hard'
export type GamePhase = 'idle' | 'playing' | 'won' | 'lost'

export interface Cell {
  scorpion: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

export type Board = Cell[][]

export interface DiffConfig {
  rows: number
  cols: number
  scorpions: number
  cellPx: number
}

export const DIFF_CONFIG: Record<Difficulty, DiffConfig> = {
  easy: { rows: 8, cols: 8, scorpions: 10, cellPx: 32 },
  medium: { rows: 12, cols: 12, scorpions: 25, cellPx: 24 },
  hard: { rows: 16, cols: 16, scorpions: 50, cellPx: 18 },
}

export function createEmptyBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): Cell => ({
      scorpion: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    })),
  )
}

export function getNeighbours(
  row: number,
  col: number,
  rows: number,
  cols: number,
): [number, number][] {
  const result: [number, number][] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr
      const c = col + dc
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        result.push([r, c])
      }
    }
  }
  return result
}

export function placeScorpions(
  board: Board,
  clickRow: number,
  clickCol: number,
  scorpionCount: number,
): Board {
  const rows = board.length
  const cols = board[0].length

  const safeSet = new Set<string>()
  safeSet.add(`${clickRow},${clickCol}`)
  for (const [r, c] of getNeighbours(clickRow, clickCol, rows, cols)) {
    safeSet.add(`${r},${c}`)
  }

  const pool: [number, number][] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safeSet.has(`${r},${c}`)) {
        pool.push([r, c])
      }
    }
  }

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  const next: Board = board.map((row) => row.map((cell) => ({ ...cell })))
  const count = Math.min(scorpionCount, pool.length)
  for (let i = 0; i < count; i++) {
    const [r, c] = pool[i]
    next[r][c].scorpion = true
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (next[r][c].scorpion) continue
      next[r][c].adjacent = getNeighbours(r, c, rows, cols).filter(
        ([nr, nc]) => next[nr][nc].scorpion,
      ).length
    }
  }

  return next
}

export function revealFrom(board: Board, startRow: number, startCol: number): Board {
  const rows = board.length
  const cols = board[0].length
  const next: Board = board.map((row) => row.map((cell) => ({ ...cell })))

  const queue: [number, number][] = [[startRow, startCol]]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const [r, c] = queue.shift()!
    const key = `${r},${c}`
    if (visited.has(key)) continue
    visited.add(key)

    const cell = next[r][c]
    if (cell.flagged || cell.revealed || cell.scorpion) continue

    cell.revealed = true

    if (cell.adjacent === 0) {
      for (const [nr, nc] of getNeighbours(r, c, rows, cols)) {
        if (!visited.has(`${nr},${nc}`) && !next[nr][nc].revealed && !next[nr][nc].flagged) {
          queue.push([nr, nc])
        }
      }
    }
  }

  return next
}

export function toggleFlag(board: Board, row: number, col: number): Board {
  if (board[row][col].revealed) return board
  const next: Board = board.map((r) => r.map((cell) => ({ ...cell })))
  next[row][col].flagged = !next[row][col].flagged
  return next
}

export function checkWin(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell.scorpion || cell.revealed))
}

export function exposeScorpions(board: Board, hitRow: number, hitCol: number): Board {
  return board.map((row, r) =>
    row.map((cell, c): Cell => ({
      ...cell,
      revealed: cell.scorpion ? true : cell.revealed,
      flagged: (r === hitRow && c === hitCol) ? false : cell.flagged,
    })),
  )
}

export interface MinesweeperStats {
  wins: number
  losses: number
  bestTime: number | null
}

function statsKey(difficulty: Difficulty): string {
  return `ms_stats_${difficulty}`
}

export function loadStats(difficulty: Difficulty): MinesweeperStats {
  try {
    const raw = localStorage.getItem(statsKey(difficulty))
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MinesweeperStats>
      return {
        wins: typeof parsed.wins === 'number' ? parsed.wins : 0,
        losses: typeof parsed.losses === 'number' ? parsed.losses : 0,
        bestTime: typeof parsed.bestTime === 'number' ? parsed.bestTime : null,
      }
    }
  } catch {
    // Ignore corrupt storage.
  }
  return { wins: 0, losses: 0, bestTime: null }
}

export function recordWin(difficulty: Difficulty, timeSec: number): MinesweeperStats {
  const stats = loadStats(difficulty)
  stats.wins++
  if (stats.bestTime === null || timeSec < stats.bestTime) {
    stats.bestTime = timeSec
  }
  try {
    localStorage.setItem(statsKey(difficulty), JSON.stringify(stats))
  } catch {
    // Ignore storage failures.
  }
  return stats
}

export function recordLoss(difficulty: Difficulty): MinesweeperStats {
  const stats = loadStats(difficulty)
  stats.losses++
  try {
    localStorage.setItem(statsKey(difficulty), JSON.stringify(stats))
  } catch {
    // Ignore storage failures.
  }
  return stats
}

export const NUMBER_COLORS: Record<number, string> = {
  1: '#569cd6',
  2: '#4ec9b0',
  3: '#f44747',
  4: '#c8a850',
  5: '#d16969',
  6: '#4dc4c4',
  7: '#dcdcaa',
  8: '#9a9a9a',
}

export function countFlags(board: Board): number {
  return board.reduce((sum, row) => sum + row.filter((cell) => cell.flagged).length, 0)
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${secs}`
}
