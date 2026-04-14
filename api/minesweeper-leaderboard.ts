import { neon } from '@neondatabase/serverless'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import {
  canonicalizeIdentity,
  isBetterScore,
  validateLeaderboardName,
} from '../src/lib/leaderboardIdentity'

type SqlClient = ReturnType<typeof getDb>

const TOP_N = 10

interface SubmitRequest {
  username: string
  score: number
  metadata?: string | null
}

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set')
  return neon(url)
}

async function ensureTable(sql: SqlClient) {
  await sql`
    CREATE TABLE IF NOT EXISTS minesweeper_leaderboard_entries (
      username TEXT NOT NULL,
      username_normalized TEXT PRIMARY KEY,
      score INTEGER NOT NULL,
      metadata TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

async function handleGet(res: VercelResponse) {
  const sql = getDb()
  await ensureTable(sql)
  const rows = await sql`
    SELECT username, score, metadata, updated_at
    FROM minesweeper_leaderboard_entries
    WHERE score > 0
    ORDER BY score ASC, updated_at ASC
    LIMIT ${TOP_N}
  `

  const entries = rows.map((row, index) => ({
    rank: index + 1,
    username: row.username as string,
    score: row.score as number,
    metadata: (row.metadata as string | null) ?? null,
    timestamp: new Date(row.updated_at as string | number | Date).toISOString(),
  }))

  return res.status(200).json({
    topScore: entries.length > 0 ? { username: entries[0].username, score: entries[0].score } : null,
    entries,
    cutoffScore: entries.length >= TOP_N ? entries[TOP_N - 1].score : null,
  })
}

async function handleSubmit(body: SubmitRequest, res: VercelResponse) {
  const validation = validateLeaderboardName(body.username)
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error })
  }

  const identity = canonicalizeIdentity(validation.name)
  const score = body.score
  if (typeof score !== 'number' || !Number.isInteger(score) || score <= 0) {
    return res.status(400).json({ error: 'Score must be a positive integer' })
  }

  const metadata = typeof body.metadata === 'string' && body.metadata.trim() ? body.metadata.trim().slice(0, 32) : null

  const sql = getDb()
  await ensureTable(sql)

  const existingRows = await sql`
    SELECT score FROM minesweeper_leaderboard_entries
    WHERE username_normalized = ${identity.normalized}
    LIMIT 1
  `

  if (existingRows.length > 0) {
    const existingScore = existingRows[0].score as number
    if (!isBetterScore('minesweeper', score, existingScore)) {
      return res.status(200).json({ success: true, keptExisting: true })
    }
  } else {
    const topRows = await sql`
      SELECT score FROM minesweeper_leaderboard_entries
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
    INSERT INTO minesweeper_leaderboard_entries (username, username_normalized, score, metadata)
    VALUES (${identity.display}, ${identity.normalized}, ${score}, ${metadata})
    ON CONFLICT (username_normalized)
    DO UPDATE SET
      username = EXCLUDED.username,
      score = EXCLUDED.score,
      metadata = EXCLUDED.metadata,
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
    if (req.method === 'GET') return await handleGet(res)
    if (req.method === 'POST') return await handleSubmit((req.body ?? {}) as SubmitRequest, res)
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('minesweeper-leaderboard error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
