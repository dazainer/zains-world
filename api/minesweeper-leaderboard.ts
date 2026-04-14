import { neon } from '@neondatabase/serverless'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import {
  isLeaderboardDifficulty,
  isOverrideCode,
  isBetterAscending,
  type LeaderboardDifficulty,
  validateLeaderboardName,
} from './leaderboardIdentity.js'

type SqlClient = ReturnType<typeof getDb>

const TOP_N = 10
const DEFAULT_DIFFICULTY: LeaderboardDifficulty = 'medium'

interface SubmitRequest {
  username: string
  score: number
  metadata?: string | null
  sessionId?: string
  difficulty?: LeaderboardDifficulty
}

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set')
  return neon(url)
}

async function ensureTable(sql: SqlClient) {
  await sql`
    CREATE TABLE IF NOT EXISTS minesweeper_leaderboard_entries_v2 (
      username TEXT NOT NULL,
      username_normalized TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
      score INTEGER NOT NULL,
      metadata TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      owner_session_id TEXT,
      PRIMARY KEY (username_normalized, difficulty)
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS minesweeper_leaderboard_entries_v2_score_idx
    ON minesweeper_leaderboard_entries_v2 (difficulty, score ASC, updated_at ASC)
  `

  const legacyRows = await sql`
    SELECT to_regclass('public.minesweeper_leaderboard_entries') AS legacy
  `
  if (!legacyRows[0]?.legacy) return

  await sql`
    ALTER TABLE minesweeper_leaderboard_entries
    ADD COLUMN IF NOT EXISTS owner_session_id TEXT
  `

  await sql`
    INSERT INTO minesweeper_leaderboard_entries_v2 (
      username,
      username_normalized,
      difficulty,
      score,
      metadata,
      created_at,
      updated_at,
      owner_session_id
    )
    SELECT
      username,
      username_normalized,
      CASE
        WHEN metadata ILIKE 'easy%' THEN 'easy'
        WHEN metadata ILIKE 'medium%' THEN 'medium'
        WHEN metadata ILIKE 'hard%' THEN 'hard'
        ELSE ${DEFAULT_DIFFICULTY}
      END,
      score,
      metadata,
      created_at,
      updated_at,
      owner_session_id
    FROM minesweeper_leaderboard_entries
    ON CONFLICT (username_normalized, difficulty) DO NOTHING
  `
}

function resolveDifficulty(raw: unknown): { ok: true; difficulty: LeaderboardDifficulty } | { ok: false; error: string } {
  if (typeof raw === 'undefined') {
    return { ok: true, difficulty: DEFAULT_DIFFICULTY }
  }

  const difficulty = Array.isArray(raw) ? raw[0] : raw
  if (!isLeaderboardDifficulty(difficulty)) {
    return { ok: false, error: 'Difficulty is invalid' }
  }

  return { ok: true, difficulty }
}

function validateSessionId(raw: unknown): { ok: true; sessionId: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') return { ok: false, error: 'Session is required' }
  const sessionId = raw.trim()
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(sessionId)) {
    return { ok: false, error: 'Session is invalid' }
  }
  return { ok: true, sessionId }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const difficultyResult = resolveDifficulty(req.query.difficulty)
  if (!difficultyResult.ok) {
    return res.status(400).json({ error: difficultyResult.error })
  }

  const sql = getDb()
  await ensureTable(sql)
  const rows = await sql`
    SELECT username, score, metadata, updated_at, difficulty
    FROM minesweeper_leaderboard_entries_v2
    WHERE score > 0
      AND difficulty = ${difficultyResult.difficulty}
    ORDER BY score ASC, updated_at ASC
    LIMIT ${TOP_N}
  `

  const entries = rows.map((row, index) => ({
    rank: index + 1,
    username: row.username as string,
    score: row.score as number,
    metadata: (row.metadata as string | null) ?? null,
    timestamp: new Date(row.updated_at as string | number | Date).toISOString(),
    difficulty: row.difficulty as LeaderboardDifficulty,
  }))

  return res.status(200).json({
    topScore: entries.length > 0 ? { username: entries[0].username, score: entries[0].score } : null,
    entries,
    cutoffScore: entries.length >= TOP_N ? entries[TOP_N - 1].score : null,
    difficulty: difficultyResult.difficulty,
  })
}

async function handleSubmit(body: SubmitRequest, res: VercelResponse) {
  const sessionResult = validateSessionId(body.sessionId)
  if (!sessionResult.ok) {
    return res.status(400).json({ error: sessionResult.error })
  }

  const rawUsername = typeof body.username === 'string' ? body.username.trim() : ''
  const validation = validateLeaderboardName(body.username)
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error })
  }

  const difficultyResult = resolveDifficulty(body.difficulty)
  if (!difficultyResult.ok) {
    return res.status(400).json({ error: difficultyResult.error })
  }
  const { difficulty } = difficultyResult

  const identity = { display: validation.name, normalized: validation.normalized }
  const isOverrideSubmission = isOverrideCode(rawUsername)
  const score = body.score
  if (typeof score !== 'number' || !Number.isInteger(score) || score <= 0) {
    return res.status(400).json({ error: 'Score must be a positive integer' })
  }

  const metadata = typeof body.metadata === 'string' && body.metadata.trim() ? body.metadata.trim().slice(0, 32) : null

  const sql = getDb()
  await ensureTable(sql)

  const existingRows = await sql`
    SELECT score
    FROM minesweeper_leaderboard_entries_v2
    WHERE username_normalized = ${identity.normalized}
      AND difficulty = ${difficulty}
    LIMIT 1
  `

  const ownedRows = await sql`
    SELECT owner_session_id
    FROM minesweeper_leaderboard_entries_v2
    WHERE username_normalized = ${identity.normalized}
    LIMIT 1
  `

  if (!isOverrideSubmission) {
    const claimedRows = await sql`
      SELECT username_normalized FROM minesweeper_leaderboard_entries_v2
      WHERE owner_session_id = ${sessionResult.sessionId}
      LIMIT 1
    `
    if (claimedRows.length > 0 && (claimedRows[0].username_normalized as string) !== identity.normalized) {
      return res.status(409).json({ error: 'This visit already claimed a different username' })
    }
  }

  if (!isOverrideSubmission && ownedRows.length > 0) {
    const ownerSessionId = ownedRows[0].owner_session_id as string | null
    if (ownerSessionId !== sessionResult.sessionId) {
      return res.status(409).json({ error: 'That username is already taken for another visit' })
    }
  }

  if (existingRows.length > 0) {
    const existingScore = existingRows[0].score as number
    if (!isBetterAscending(score, existingScore)) {
      return res.status(200).json({ success: true, keptExisting: true })
    }
  } else {
    const topRows = await sql`
      SELECT score FROM minesweeper_leaderboard_entries_v2
      WHERE difficulty = ${difficulty}
      ORDER BY score ASC, updated_at ASC
      LIMIT ${TOP_N}
    `
    if (topRows.length >= TOP_N) {
      const cutoff = topRows[TOP_N - 1].score as number
      if (score >= cutoff) {
        return res.status(422).json({ error: 'That time no longer qualifies for the top 10' })
      }
    }
  }

  await sql`
    INSERT INTO minesweeper_leaderboard_entries_v2 (username, username_normalized, difficulty, score, metadata, owner_session_id)
    VALUES (
      ${identity.display},
      ${identity.normalized},
      ${difficulty},
      ${score},
      ${metadata},
      ${isOverrideSubmission ? null : sessionResult.sessionId}
    )
    ON CONFLICT (username_normalized, difficulty)
    DO UPDATE SET
      username = EXCLUDED.username,
      difficulty = EXCLUDED.difficulty,
      score = EXCLUDED.score,
      metadata = EXCLUDED.metadata,
      owner_session_id = EXCLUDED.owner_session_id,
      updated_at = NOW()
  `

  return res.status(existingRows.length > 0 ? 200 : 201).json({ success: true, keptExisting: false })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    if (req.method === 'GET') return await handleGet(req, res)
    if (req.method === 'POST') return await handleSubmit((req.body ?? {}) as SubmitRequest, res)
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('minesweeper-leaderboard error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
