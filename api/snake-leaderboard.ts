import { neon } from '@neondatabase/serverless'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// ---------- helpers ----------

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set')
  return neon(url)
}

// ---------- username validation ----------

const USERNAME_RE = /^[A-Za-z0-9_-]{3,16}$/

const RESERVED_NAMES = new Set([
  'admin',
  'administrator',
  'moderator',
  'mod',
  'vercel',
  'zain',
  'system',
  'root',
  'null',
  'undefined',
])

// Basic profanity denylist — kept intentionally small; extend as needed
const PROFANITY: string[] = [
  'fuck', 'shit', 'ass', 'damn', 'bitch', 'dick', 'cock', 'pussy',
  'cunt', 'bastard', 'slut', 'whore', 'fag', 'nigger', 'nigga',
  'retard', 'rape', 'penis', 'vagina', 'anus', 'porn', 'cum',
  'nazi', 'hitler', 'kill', 'die',
]

function isProfane(name: string): boolean {
  const lower = name.toLowerCase()
  return PROFANITY.some((word) => lower.includes(word))
}

function validateUsername(raw: unknown): { ok: true; display: string; normalized: string } | { ok: false; error: string; status: number } {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return { ok: false, error: 'Username is required', status: 400 }
  }
  const display = raw.trim()
  if (!USERNAME_RE.test(display)) {
    return { ok: false, error: 'Username contains unsupported characters (allowed: A-Z, a-z, 0-9, _, -) and must be 3-16 characters', status: 400 }
  }
  const normalized = display.toLowerCase()
  if (RESERVED_NAMES.has(normalized)) {
    return { ok: false, error: 'Username is not allowed', status: 400 }
  }
  if (isProfane(normalized)) {
    return { ok: false, error: 'Username is not allowed', status: 400 }
  }
  return { ok: true, display, normalized }
}

// ---------- handlers ----------

async function handleGet(res: VercelResponse) {
  const sql = getDb()
  const rows = await sql`
    SELECT username, score
    FROM snake_leaderboard_entries
    ORDER BY score DESC, created_at ASC
    LIMIT 10
  `

  const entries = rows.map((r, i) => ({
    rank: i + 1,
    username: r.username as string,
    score: r.score as number,
  }))

  const topScore = entries.length > 0 ? { username: entries[0].username, score: entries[0].score } : null
  const cutoffScore = entries.length >= 10 ? entries[9].score : null

  return res.status(200).json({ topScore, entries, cutoffScore })
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const { username: rawUsername, score } = req.body ?? {}

  // Validate username
  const usernameResult = validateUsername(rawUsername)
  if (usernameResult.ok === false) {
    return res.status(usernameResult.status).json({ error: usernameResult.error })
  }
  const { display, normalized } = usernameResult

  // Validate score
  if (typeof score !== 'number' || !Number.isInteger(score) || score <= 0) {
    return res.status(400).json({ error: 'Score must be a positive integer' })
  }

  const sql = getDb()

  // Check duplicate username
  const existing = await sql`
    SELECT 1 FROM snake_leaderboard_entries WHERE username_normalized = ${normalized} LIMIT 1
  `
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Username already taken' })
  }

  // Check qualification: score must be strictly greater than the 10th-place score
  const topRows = await sql`
    SELECT score FROM snake_leaderboard_entries
    ORDER BY score DESC, created_at ASC
    LIMIT 10
  `
  if (topRows.length >= 10) {
    const cutoff = topRows[9].score as number
    if (score <= cutoff) {
      return res.status(422).json({ error: 'That score no longer qualifies for the top 10' })
    }
  }

  // Insert
  await sql`
    INSERT INTO snake_leaderboard_entries (username, username_normalized, score)
    VALUES (${display}, ${normalized}, ${score})
  `

  return res.status(201).json({ success: true })
}

// ---------- entry point ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    if (req.method === 'GET') {
      return await handleGet(res)
    }
    if (req.method === 'POST') {
      return await handlePost(req, res)
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('snake-leaderboard error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
