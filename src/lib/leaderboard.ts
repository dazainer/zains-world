/**
 * leaderboard.ts — Local leaderboard manager for all mini-games.
 *
 * All data is stored in localStorage only — no remote API involved.
 * The remote snake leaderboard lives in api/snake-leaderboard.ts and is
 * intentionally untouched by this module.
 *
 * Storage layout
 * ──────────────
 *   lbEntries    JSON array of LeaderboardEntry  (all games, all time)
 *   lbPlayerName string                          (reused across games)
 *
 * Sort conventions
 * ────────────────
 *   snake       — higher score is better   (points)
 *   tictactoe   — higher score is better   (win streak)
 *   minesweeper — lower score is better    (seconds, stored as positive int)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type LeaderboardGame = 'snake' | 'tictactoe' | 'minesweeper'

export interface LeaderboardEntry {
  /** Stable unique id — used for React keys and deduplication. */
  id: string
  playerName: string
  game: LeaderboardGame
  /**
   * Game-specific score value.
   * snake      → points earned
   * tictactoe  → current win streak at the time of submission
   * minesweeper→ elapsed seconds (lower = better)
   */
  score: number
  /**
   * Optional human-readable context string shown in the leaderboard row.
   * Examples: "Hard · 02:31", "Medium", null
   */
  metadata: string | null
  /** ISO 8601 date-time string. */
  timestamp: string
}

export type SortOrder = 'desc' | 'asc'

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEY_ENTRIES    = 'lbEntries'
const KEY_PLAYER     = 'lbPlayerName'
const TOP_N          = 10

// ── Sort direction per game ───────────────────────────────────────────────────

const SORT_ORDER: Record<LeaderboardGame, SortOrder> = {
  snake:       'desc',
  tictactoe:   'desc',
  minesweeper: 'asc',
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function readEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(KEY_ENTRIES)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as LeaderboardEntry[]
  } catch {
    return []
  }
}

function writeEntries(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(KEY_ENTRIES, JSON.stringify(entries))
  } catch {
    // Ignore storage quota errors — leaderboard is best-effort
  }
}

// ── Sorting ───────────────────────────────────────────────────────────────────

/**
 * Sort entries for a specific game according to its sort convention.
 * Ties are broken by timestamp (earlier = better — first to achieve it).
 */
function sortForGame(entries: LeaderboardEntry[], game: LeaderboardGame): LeaderboardEntry[] {
  const order = SORT_ORDER[game]
  return [...entries].sort((a, b) => {
    if (order === 'desc') {
      if (b.score !== a.score) return b.score - a.score
    } else {
      if (a.score !== b.score) return a.score - b.score
    }
    // Stable: earlier timestamp wins ties
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Return the top-N entries for a game, sorted correctly.
 * Returns an empty array if there are no entries.
 */
export function getEntries(game: LeaderboardGame): LeaderboardEntry[] {
  const all = readEntries().filter(e => e.game === game)
  return sortForGame(all, game).slice(0, TOP_N)
}

/**
 * Add a new entry to the leaderboard. After insertion the list for that game
 * is sorted and trimmed to TOP_N, so only the best scores survive.
 *
 * Returns the saved entry.
 */
export function addEntry(
  game: LeaderboardGame,
  playerName: string,
  score: number,
  metadata: string | null = null,
): LeaderboardEntry {
  const entry: LeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerName: playerName.trim(),
    game,
    score,
    metadata,
    timestamp: new Date().toISOString(),
  }

  const all = readEntries()
  const forGame = sortForGame([...all.filter(e => e.game === game), entry], game)
  const trimmed = forGame.slice(0, TOP_N)

  // Rebuild: keep all entries from OTHER games + the trimmed set for this game
  const others = all.filter(e => e.game !== game)
  writeEntries([...others, ...trimmed])

  return entry
}

/**
 * Check whether a given score qualifies for the top-N list for a game.
 * Useful for deciding whether to prompt the player to enter their name.
 */
export function qualifies(game: LeaderboardGame, score: number): boolean {
  const existing = getEntries(game)
  if (existing.length < TOP_N) return true

  const order = SORT_ORDER[game]
  const worst = existing[existing.length - 1]
  return order === 'desc' ? score > worst.score : score < worst.score
}

// ── Player name ───────────────────────────────────────────────────────────────

/** Read the stored player name. Returns null if none has been set yet. */
export function getPlayerName(): string | null {
  try {
    const name = localStorage.getItem(KEY_PLAYER)
    return name && name.trim() ? name.trim() : null
  } catch {
    return null
  }
}

/** Persist the player name after validation. Returns the validation result. */
export function setPlayerName(raw: string): { ok: true; name: string } | { ok: false; error: string } {
  const result = validatePlayerName(raw)
  if (!result.ok) return result
  try {
    localStorage.setItem(KEY_PLAYER, result.name)
  } catch {
    // ignore storage errors
  }
  return result
}

// ── Name validation ───────────────────────────────────────────────────────────

const NAME_RE = /^[A-Za-z0-9 _-]{2,16}$/

const RESERVED = new Set([
  'admin', 'administrator', 'moderator', 'mod', 'system', 'root',
  'null', 'undefined', 'zain',
])

const PROFANITY = [
  'fuck', 'shit', 'ass', 'damn', 'bitch', 'dick', 'cock', 'pussy',
  'cunt', 'bastard', 'slut', 'whore', 'fag', 'nigger', 'nigga',
  'retard', 'rape', 'nazi', 'hitler',
]

export function validatePlayerName(
  raw: string,
): { ok: true; name: string } | { ok: false; error: string } {
  const name = raw.trim()
  if (!name) return { ok: false, error: 'Name cannot be empty' }
  if (!NAME_RE.test(name)) {
    return {
      ok: false,
      error: 'Name must be 2-16 characters. Letters, numbers, spaces, _ and - allowed.',
    }
  }
  const lower = name.toLowerCase().replace(/\s+/g, '')
  if (RESERVED.has(lower)) return { ok: false, error: 'That name is not allowed' }
  if (PROFANITY.some(w => lower.includes(w))) return { ok: false, error: 'That name is not allowed' }
  return { ok: true, name }
}

// ── Score display ─────────────────────────────────────────────────────────────

/**
 * Format a raw score value for display in the leaderboard table.
 *
 * snake      42        → "42 pts"
 * tictactoe  5         → "5 wins"  (streak)
 * minesweeper 85       → "01:25"   (mm:ss)
 */
export function formatScore(game: LeaderboardGame, score: number): string {
  if (game === 'snake')       return `${score} pts`
  if (game === 'tictactoe')   return `${score} W`
  // minesweeper: score is seconds
  const m = Math.floor(score / 60).toString().padStart(2, '0')
  const s = (score % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/**
 * Human-readable relative date string.
 * Recent entries show "Xh ago", older ones show the date.
 */
export function formatDate(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1)    return 'just now'
    if (diffMin < 60)   return `${diffMin}m ago`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24)     return `${diffH}h ago`
    const diffD = Math.floor(diffH / 24)
    if (diffD === 1)    return 'yesterday'
    if (diffD < 7)      return `${diffD}d ago`
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

// ── Cross-game stat summaries ─────────────────────────────────────────────────
// These read from the game-specific storage written by tictactoe.ts and
// minesweeper.ts WITHOUT modifying those files or their schemas.

type TTTDifficulty = 'easy' | 'medium' | 'hard'

interface TTTDiffStats {
  wins: number
  losses: number
  draws: number
  bestWinStreak: number
  currentWinStreak: number
}

interface TTTSummary {
  totalWins: number
  totalLosses: number
  totalDraws: number
  bestWinStreak: number
  byDifficulty: Record<TTTDifficulty, TTTDiffStats>
}

/** Aggregate all TTT localStorage stats without touching any existing files. */
export function readTTTSummary(): TTTSummary {
  const blank = (): TTTDiffStats => ({
    wins: 0, losses: 0, draws: 0, bestWinStreak: 0, currentWinStreak: 0,
  })

  const byDifficulty: Record<TTTDifficulty, TTTDiffStats> = {
    easy: blank(), medium: blank(), hard: blank(),
  }

  for (const d of ['easy', 'medium', 'hard'] as TTTDifficulty[]) {
    try {
      const raw = localStorage.getItem(`ttt_stats_${d}`)
      if (raw) {
        const p = JSON.parse(raw) as Partial<TTTDiffStats>
        byDifficulty[d] = {
          wins:             typeof p.wins === 'number' ? p.wins : 0,
          losses:           typeof p.losses === 'number' ? p.losses : 0,
          draws:            typeof p.draws === 'number' ? p.draws : 0,
          bestWinStreak:    typeof p.bestWinStreak === 'number' ? p.bestWinStreak : 0,
          currentWinStreak: typeof p.currentWinStreak === 'number' ? p.currentWinStreak : 0,
        }
      }
    } catch {
      // ignore corrupt storage
    }
  }

  return {
    totalWins:   byDifficulty.easy.wins   + byDifficulty.medium.wins   + byDifficulty.hard.wins,
    totalLosses: byDifficulty.easy.losses + byDifficulty.medium.losses + byDifficulty.hard.losses,
    totalDraws:  byDifficulty.easy.draws  + byDifficulty.medium.draws  + byDifficulty.hard.draws,
    bestWinStreak: Math.max(
      byDifficulty.easy.bestWinStreak,
      byDifficulty.medium.bestWinStreak,
      byDifficulty.hard.bestWinStreak,
    ),
    byDifficulty,
  }
}

type MSDifficulty = 'easy' | 'medium' | 'hard'

interface MSDiffStats {
  wins: number
  losses: number
  bestTime: number | null
}

interface MSSummary {
  totalWins: number
  totalLosses: number
  bestTimes: Record<MSDifficulty, number | null>
}

/** Aggregate all Minesweeper localStorage stats without touching any existing files. */
export function readMinesweeperSummary(): MSSummary {
  const bestTimes: Record<MSDifficulty, number | null> = {
    easy: null, medium: null, hard: null,
  }
  let totalWins = 0
  let totalLosses = 0

  for (const d of ['easy', 'medium', 'hard'] as MSDifficulty[]) {
    try {
      const raw = localStorage.getItem(`ms_stats_${d}`)
      if (raw) {
        const p = JSON.parse(raw) as Partial<MSDiffStats>
        totalWins   += typeof p.wins   === 'number' ? p.wins   : 0
        totalLosses += typeof p.losses === 'number' ? p.losses : 0
        bestTimes[d] = typeof p.bestTime === 'number' ? p.bestTime : null
      }
    } catch {
      // ignore
    }
  }

  return { totalWins, totalLosses, bestTimes }
}
