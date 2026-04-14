/**
 * leaderboard.ts — Shared leaderboard helpers for all mini-games.
 *
 * Local run stats still live in localStorage, but the Hall of Records uses
 * remote API routes. The current visit's claimed identity is tracked in
 * sessionStorage so casual visitors can claim a name once per visit.
 *
 * Storage layout
 * ──────────────
 *   lbEntries        JSON array of LeaderboardEntry  (legacy/local helpers)
 *   lbSessionPlayer  JSON session identity           (per browser session)
 *   lbSessionId      string session id               (per browser session)
 *
 * Sort conventions
 * ────────────────
 *   snake       — higher score is better   (points)
 *   tictactoe   — higher score is better   (win streak)
 *   minesweeper — lower score is better    (seconds, stored as positive int)
 */

import {
  canonicalizeIdentity,
  isBetterScore,
  SORT_ORDER,
  type LeaderboardGame,
  validateLeaderboardName,
} from './leaderboardIdentity'

export type { LeaderboardGame } from './leaderboardIdentity'

// ── Types ─────────────────────────────────────────────────────────────────────

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

export interface SaveEntryResult {
  status: 'inserted' | 'updated' | 'kept-existing'
  entry: LeaderboardEntry
}

export interface SessionPlayerIdentity {
  raw: string
  display: string
  normalized: string
  sessionId: string
}

export interface RemoteSnakeLeaderboardEntry {
  rank: number
  username: string
  score: number
  metadata?: string | null
  timestamp?: string
}

export interface RemoteSnakeLeaderboardData {
  topScore: { username: string; score: number } | null
  entries: RemoteSnakeLeaderboardEntry[]
  cutoffScore: number | null
}

export type RemoteLeaderboardEntry = RemoteSnakeLeaderboardEntry
export type RemoteLeaderboardData = RemoteSnakeLeaderboardData

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEY_ENTRIES = 'lbEntries'
const LEGACY_KEY_PLAYER = 'lbPlayerName'
const KEY_SESSION_PLAYER = 'lbSessionPlayer'
const KEY_SESSION_ID = 'lbSessionId'
const TOP_N = 10

let memorySessionId: string | null = null
let memorySessionPlayer: SessionPlayerIdentity | null = null

// ── Sort direction per game ───────────────────────────────────────────────────

const SORT_ORDER_LOCAL: Record<LeaderboardGame, SortOrder> = SORT_ORDER

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
  const order = SORT_ORDER_LOCAL[game]
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

function isBetterEntry(game: LeaderboardGame, candidate: LeaderboardEntry, current: LeaderboardEntry): boolean {
  if (candidate.score !== current.score) {
    return isBetterScore(game, candidate.score, current.score)
  }
  return new Date(candidate.timestamp).getTime() < new Date(current.timestamp).getTime()
}

function normalizeStoredEntry(entry: LeaderboardEntry): LeaderboardEntry {
  const identity = canonicalizeIdentity(entry.playerName)
  return {
    ...entry,
    playerName: identity.display,
  }
}

function entryPlayerKey(entry: LeaderboardEntry): string {
  return canonicalizeIdentity(entry.playerName).normalized
}

function normalizeEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const bestByPlayer = new Map<string, LeaderboardEntry>()

  for (const raw of entries) {
    const entry = normalizeStoredEntry(raw)
    const key = `${entry.game}:${entryPlayerKey(entry)}`
    const existing = bestByPlayer.get(key)

    if (!existing || isBetterEntry(entry.game, entry, existing)) {
      bestByPlayer.set(key, entry)
    }
  }

  const normalized = [...bestByPlayer.values()]
  const trimmed: LeaderboardEntry[] = []

  for (const game of Object.keys(SORT_ORDER) as LeaderboardGame[]) {
    trimmed.push(...sortForGame(normalized.filter((entry) => entry.game === game), game).slice(0, TOP_N))
  }

  return trimmed
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Return the top-N entries for a game, sorted correctly.
 * Returns an empty array if there are no entries.
 */
export function getEntries(game: LeaderboardGame): LeaderboardEntry[] {
  const all = normalizeEntries(readEntries()).filter(e => e.game === game)
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
): SaveEntryResult {
  const identity = canonicalizeIdentity(playerName)
  const all = normalizeEntries(readEntries())
  const existing = all.find((entry) => entry.game === game && entryPlayerKey(entry) === identity.normalized)

  if (existing && !isBetterScore(game, score, existing.score)) {
    return { status: 'kept-existing', entry: existing }
  }

  const nextEntry: LeaderboardEntry = {
    id: existing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerName: identity.display,
    game,
    score,
    metadata,
    timestamp: new Date().toISOString(),
  }

  const merged = normalizeEntries([
    ...all.filter((entry) => !(entry.game === game && entryPlayerKey(entry) === identity.normalized)),
    nextEntry,
  ])

  writeEntries(merged)

  return {
    status: existing ? 'updated' : 'inserted',
    entry: merged.find((entry) => entry.game === game && entryPlayerKey(entry) === identity.normalized) ?? nextEntry,
  }
}

/**
 * Check whether a given score qualifies for the top-N list for a game.
 * Useful for deciding whether to prompt the player to enter their name.
 */
export function qualifies(game: LeaderboardGame, score: number, playerName?: string): boolean {
  const existing = getEntries(game)
  if (playerName) {
    const identity = canonicalizeIdentity(playerName)
    const ownExisting = existing.find((entry) => entryPlayerKey(entry) === identity.normalized)
    if (ownExisting) {
      return isBetterScore(game, score, ownExisting.score)
    }
  }
  if (existing.length < TOP_N) return true

  const order = SORT_ORDER[game]
  const worst = existing[existing.length - 1]
  return order === 'desc' ? score > worst.score : score < worst.score
}

// ── Player identity ───────────────────────────────────────────────────────────

function clearLegacyPlayerName(): void {
  try {
    localStorage.removeItem(LEGACY_KEY_PLAYER)
  } catch {
    // ignore storage failures
  }
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export function getLeaderboardSessionId(): string {
  if (memorySessionId) return memorySessionId

  try {
    const stored = sessionStorage.getItem(KEY_SESSION_ID)
    if (stored && stored.trim()) {
      memorySessionId = stored
      return stored
    }

    const next = createSessionId()
    sessionStorage.setItem(KEY_SESSION_ID, next)
    memorySessionId = next
    return next
  } catch {
    memorySessionId = memorySessionId ?? createSessionId()
    return memorySessionId
  }
}

function readSessionPlayer(): SessionPlayerIdentity | null {
  clearLegacyPlayerName()

  try {
    const raw = sessionStorage.getItem(KEY_SESSION_PLAYER)
    if (!raw) return memorySessionPlayer

    const parsed = JSON.parse(raw) as Partial<SessionPlayerIdentity>
    if (
      typeof parsed.raw === 'string' &&
      typeof parsed.display === 'string' &&
      typeof parsed.normalized === 'string' &&
      typeof parsed.sessionId === 'string'
    ) {
      memorySessionPlayer = {
        raw: parsed.raw,
        display: parsed.display,
        normalized: parsed.normalized,
        sessionId: parsed.sessionId,
      }
      return memorySessionPlayer
    }
  } catch {
    // ignore corrupt session state
  }

  return memorySessionPlayer
}

function writeSessionPlayer(identity: SessionPlayerIdentity): void {
  memorySessionPlayer = identity
  clearLegacyPlayerName()
  try {
    sessionStorage.setItem(KEY_SESSION_PLAYER, JSON.stringify(identity))
  } catch {
    // ignore storage failures
  }
}

export function getPlayerIdentity(): SessionPlayerIdentity | null {
  return readSessionPlayer()
}

/** Read the current visit's display name. Returns null if none has been set yet. */
export function getPlayerName(): string | null {
  return readSessionPlayer()?.display ?? null
}

/** Read the raw submitted identifier for the current visit. */
export function getPlayerSubmitName(): string | null {
  return readSessionPlayer()?.raw ?? null
}

/** Persist the current visit's player identity after validation. */
export function setPlayerName(
  raw: string,
): { ok: true; name: string; normalized: string; submitValue: string } | { ok: false; error: string } {
  const result = validatePlayerName(raw)
  if (!result.ok) return result

  writeSessionPlayer({
    raw: result.submitValue,
    display: result.name,
    normalized: result.normalized,
    sessionId: getLeaderboardSessionId(),
  })

  return result
}

// ── Name validation ───────────────────────────────────────────────────────────

export function validatePlayerName(
  raw: string,
): { ok: true; name: string; normalized: string; submitValue: string } | { ok: false; error: string } {
  const submitValue = raw.trim()
  const result = validateLeaderboardName(raw)
  return result.ok
    ? { ok: true, name: result.name, normalized: result.normalized, submitValue }
    : result
}

export function normalizeSnakeLeaderboard(data: RemoteSnakeLeaderboardData): RemoteSnakeLeaderboardData {
  const bestByPlayer = new Map<string, RemoteSnakeLeaderboardEntry>()

  for (const entry of data.entries) {
    const identity = canonicalizeIdentity(entry.username)
    const existing = bestByPlayer.get(identity.normalized)
    const candidate: RemoteSnakeLeaderboardEntry = {
      rank: entry.rank,
      username: identity.display,
      score: entry.score,
    }

    if (!existing || candidate.score > existing.score || (candidate.score === existing.score && candidate.rank < existing.rank)) {
      bestByPlayer.set(identity.normalized, candidate)
    }
  }

  const entries = [...bestByPlayer.values()]
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.rank - b.rank))
    .map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      score: entry.score,
      metadata: entry.metadata ?? null,
      timestamp: entry.timestamp,
    }))

  return {
    topScore: entries.length > 0 ? { username: entries[0].username, score: entries[0].score } : null,
    entries,
    cutoffScore: entries.length >= 10 ? entries[9].score : null,
  }
}

export function getRemoteLeaderboardPath(game: LeaderboardGame): string {
  if (game === 'snake') return '/api/snake-leaderboard'
  if (game === 'tictactoe') return '/api/tictactoe-leaderboard'
  return '/api/minesweeper-leaderboard'
}

export async function fetchRemoteLeaderboard(game: LeaderboardGame): Promise<RemoteLeaderboardData> {
  const res = await fetch(getRemoteLeaderboardPath(game))
  const text = await res.text()
  const data = text ? JSON.parse(text) as RemoteLeaderboardData | { error?: string } : { topScore: null, entries: [], cutoffScore: null }
  if (!res.ok) {
    throw new Error(('error' in data && data.error) || 'Unable to load leaderboard')
  }
  return game === 'snake'
    ? normalizeSnakeLeaderboard(data as RemoteLeaderboardData)
    : data as RemoteLeaderboardData
}

export async function submitRemoteLeaderboardEntry(
  game: Exclude<LeaderboardGame, 'snake'>,
  username: string,
  score: number,
  metadata: string | null,
): Promise<{ keptExisting: boolean }> {
  const sessionId = getLeaderboardSessionId()
  const res = await fetch(getRemoteLeaderboardPath(game), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, score, metadata, sessionId }),
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) as { error?: string; keptExisting?: boolean } : {}
  if (!res.ok) {
    throw new Error(data.error || 'Unable to submit score')
  }

  return { keptExisting: Boolean(data.keptExisting) }
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
