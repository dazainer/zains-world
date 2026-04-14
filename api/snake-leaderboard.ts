import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto'

import { neon } from '@neondatabase/serverless'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  canonicalizeIdentity,
  isProfane,
  RESERVED_USERNAMES,
  USERNAME_RE,
  validateLeaderboardName,
} from './leaderboardIdentity.js'

type SqlClient = ReturnType<typeof getDb>

const SNAKE_GRID = 20
const SNAKE_TICK_MS = 120
const SNAKE_TOTAL_CELLS = SNAKE_GRID * SNAKE_GRID
const SNAKE_MAX_SCORE = SNAKE_TOTAL_CELLS - 1
const SNAKE_RUN_TTL_MS = 2 * 60 * 60 * 1000
const SNAKE_MAX_TICKS_PER_RUN = Math.floor(SNAKE_RUN_TTL_MS / SNAKE_TICK_MS)
const SNAKE_MIN_ELAPSED_SLACK_MS = 1500
const SNAKE_ADMIN_USERNAME = 'zain'

type SnakeDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

interface SnakePosition {
  x: number
  y: number
}

interface SnakeTurnEvent {
  tick: number
  direction: SnakeDirection
}

interface SnakeRunSession {
  runToken: string
  seed: number
  issuedAt: number
  expiresAt: number
}

interface SnakeRunStartRequest {
  action: 'start'
}

interface SnakeRunSubmitRequest {
  action: 'submit'
  username: string
  score: number
  runToken: string
  turns: SnakeTurnEvent[]
}

interface RunTokenPayload {
  version: 1
  nonce: string
  seed: number
  issuedAt: number
  expiresAt: number
}

const INITIAL_SNAKE_DIRECTION: SnakeDirection = 'RIGHT'
const INITIAL_SNAKE_POSITION: SnakePosition = { x: 10, y: 10 }

// ---------- helpers ----------

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set')
  return neon(url)
}

function getRunSigningSecret() {
  const secret = process.env.SNAKE_RUN_SECRET ?? process.env.DATABASE_URL
  if (!secret) throw new Error('SNAKE_RUN_SECRET or DATABASE_URL must be set')
  return secret
}

function signTokenPayload(encodedPayload: string) {
  return createHmac('sha256', getRunSigningSecret()).update(encodedPayload).digest('base64url')
}

function serializeRunToken(payload: RunTokenPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${encodedPayload}.${signTokenPayload(encodedPayload)}`
}

function parseRunToken(raw: unknown): RunTokenPayload | null {
  if (typeof raw !== 'string') return null

  const [encodedPayload, signature, extra] = raw.split('.')
  if (!encodedPayload || !signature || extra) return null

  const expectedSignature = signTokenPayload(encodedPayload)
  const provided = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<RunTokenPayload>
    if (
      parsed.version !== 1 ||
      typeof parsed.nonce !== 'string' ||
      !parsed.nonce ||
      typeof parsed.seed !== 'number' ||
      !Number.isInteger(parsed.seed) ||
      typeof parsed.issuedAt !== 'number' ||
      !Number.isInteger(parsed.issuedAt) ||
      typeof parsed.expiresAt !== 'number' ||
      !Number.isInteger(parsed.expiresAt)
    ) {
      return null
    }

    return {
      version: 1,
      nonce: parsed.nonce,
      seed: parsed.seed,
      issuedAt: parsed.issuedAt,
      expiresAt: parsed.expiresAt,
    }
  } catch {
    return null
  }
}

async function ensureRunSessionsTable(sql: SqlClient) {
  await sql`
    CREATE TABLE IF NOT EXISTS snake_leaderboard_run_sessions (
      nonce TEXT PRIMARY KEY,
      seed INTEGER NOT NULL,
      issued_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      consumed_username_normalized TEXT
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS snake_leaderboard_run_sessions_expires_idx
    ON snake_leaderboard_run_sessions (expires_at)
  `
}

async function pruneExpiredRunSessions(sql: SqlClient) {
  await sql`
    DELETE FROM snake_leaderboard_run_sessions
    WHERE expires_at < NOW() - INTERVAL '7 days'
  `
}

function dateToMillis(value: unknown): number | null {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string' || typeof value === 'number') {
    const time = new Date(value).getTime()
    return Number.isNaN(time) ? null : time
  }
  return null
}

function createInitialSnake(): SnakePosition[] {
  return [{ ...INITIAL_SNAKE_POSITION }]
}

function isSnakeDirection(value: unknown): value is SnakeDirection {
  return value === 'UP' || value === 'DOWN' || value === 'LEFT' || value === 'RIGHT'
}

function isOppositeDirection(a: SnakeDirection, b: SnakeDirection): boolean {
  return (
    (a === 'UP' && b === 'DOWN') ||
    (a === 'DOWN' && b === 'UP') ||
    (a === 'LEFT' && b === 'RIGHT') ||
    (a === 'RIGHT' && b === 'LEFT')
  )
}

function createSeededSnakeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function nextSnakeFood(snakeBody: SnakePosition[], rng: () => number): SnakePosition | null {
  if (snakeBody.length >= SNAKE_TOTAL_CELLS) return null

  let pos: SnakePosition
  do {
    pos = {
      x: Math.floor(rng() * SNAKE_GRID),
      y: Math.floor(rng() * SNAKE_GRID),
    }
  } while (snakeBody.some((segment) => segment.x === pos.x && segment.y === pos.y))

  return pos
}

function simulateSnakeReplay(seed: number, turns: SnakeTurnEvent[]) {
  const rng = createSeededSnakeRng(seed)
  let snake = createInitialSnake()
  let food = nextSnakeFood(snake, rng)
  let direction = INITIAL_SNAKE_DIRECTION
  let turnIndex = 0
  let score = 0

  for (let tick = 1; tick <= SNAKE_MAX_TICKS_PER_RUN; tick += 1) {
    const turn = turns[turnIndex]
    if (turn) {
      if (!Number.isInteger(turn.tick) || turn.tick < 1 || turn.tick < tick) {
        return { ended: false, reason: 'invalid-turn' as const, score, ticks: tick - 1, snakeLength: snake.length }
      }
      if (turn.tick === tick) {
        if (!isSnakeDirection(turn.direction) || isOppositeDirection(turn.direction, direction)) {
          return { ended: false, reason: 'invalid-turn' as const, score, ticks: tick - 1, snakeLength: snake.length }
        }
        direction = turn.direction
        turnIndex += 1
        if (turns[turnIndex]?.tick === tick) {
          return { ended: false, reason: 'invalid-turn' as const, score, ticks: tick - 1, snakeLength: snake.length }
        }
      }
    }

    const head = snake[0]
    const newHead: SnakePosition = {
      x: head.x + (direction === 'RIGHT' ? 1 : direction === 'LEFT' ? -1 : 0),
      y: head.y + (direction === 'DOWN' ? 1 : direction === 'UP' ? -1 : 0),
    }

    if (newHead.x < 0 || newHead.x >= SNAKE_GRID || newHead.y < 0 || newHead.y >= SNAKE_GRID) {
      return { ended: true, reason: 'wall' as const, score, ticks: tick, snakeLength: snake.length }
    }

    if (snake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
      return { ended: true, reason: 'self' as const, score, ticks: tick, snakeLength: snake.length }
    }

    const newSnake = [newHead, ...snake]
    const ateFood = food !== null && newHead.x === food.x && newHead.y === food.y

    if (!ateFood) {
      newSnake.pop()
    } else {
      score = newSnake.length - 1
      if (newSnake.length === SNAKE_TOTAL_CELLS) {
        return { ended: true, reason: 'filled-board' as const, score, ticks: tick, snakeLength: newSnake.length }
      }

      food = nextSnakeFood(newSnake, rng)
      if (food === null) {
        return { ended: false, reason: 'invalid-turn' as const, score, ticks: tick, snakeLength: newSnake.length }
      }
    }

    snake = newSnake
  }

  return {
    ended: false,
    reason: 'tick-limit' as const,
    score,
    ticks: SNAKE_MAX_TICKS_PER_RUN,
    snakeLength: snake.length,
  }
}

// ---------- username validation ----------

function isAdminCode(raw: unknown): raw is string {
  if (typeof raw !== 'string' || raw.trim() === '') return false
  const adminCode = process.env.SNAKE_ADMIN_CODE?.trim()
  if (!adminCode) return false
  return raw.trim() === adminCode
}

function validateUsername(raw: unknown): { ok: true; display: string; normalized: string } | { ok: false; error: string; status: number } {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return { ok: false, error: 'Username is required', status: 400 }
  }
  const direct = raw.trim()
  const validated = validateLeaderboardName(direct)
  if (validated.ok) {
    return { ok: true, display: validated.name, normalized: validated.normalized }
  }
  if (!USERNAME_RE.test(direct)) {
    return { ok: false, error: 'Username contains unsupported characters (allowed: A-Z, a-z, 0-9, _, -) and must be 3-16 characters', status: 400 }
  }
  const identity = canonicalizeIdentity(direct)
  if (RESERVED_USERNAMES.has(identity.normalized)) {
    return { ok: false, error: 'Username is not allowed', status: 400 }
  }
  if (isProfane(identity.normalized)) {
    return { ok: false, error: 'Username is not allowed', status: 400 }
  }
  return { ok: true, display: identity.display, normalized: identity.normalized }
}

// ---------- handlers ----------

async function handleGet(res: VercelResponse) {
  const sql = getDb()
  const rows = await sql`
    SELECT username, score
    FROM snake_leaderboard_entries
    WHERE score > 0 AND score <= ${SNAKE_MAX_SCORE}
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

async function handleStart(res: VercelResponse) {
  const sql = getDb()
  await ensureRunSessionsTable(sql)
  await pruneExpiredRunSessions(sql)

  const issuedAt = Date.now()
  const expiresAt = issuedAt + SNAKE_RUN_TTL_MS
  const nonce = randomBytes(16).toString('hex')
  const seed = randomInt(1, 0x7fffffff)

  await sql`
    INSERT INTO snake_leaderboard_run_sessions (nonce, seed, issued_at, expires_at)
    VALUES (${nonce}, ${seed}, ${new Date(issuedAt)}, ${new Date(expiresAt)})
  `

  const session: SnakeRunSession = {
    runToken: serializeRunToken({
      version: 1,
      nonce,
      seed,
      issuedAt,
      expiresAt,
    }),
    seed,
    issuedAt,
    expiresAt,
  }

  return res.status(201).json(session)
}

function validateTurns(raw: unknown): SnakeTurnEvent[] | null {
  if (!Array.isArray(raw) || raw.length > SNAKE_MAX_TICKS_PER_RUN) return null
  return raw as SnakeTurnEvent[]
}

async function handleSubmit(body: SnakeRunSubmitRequest, res: VercelResponse) {
  const { username: rawUsername, score, runToken, turns: rawTurns } = body
  const adminOverride = isAdminCode(rawUsername)

  const usernameResult = adminOverride
    ? { ok: true as const, display: SNAKE_ADMIN_USERNAME, normalized: SNAKE_ADMIN_USERNAME }
    : validateUsername(rawUsername)
  if (usernameResult.ok === false) {
    return res.status(usernameResult.status).json({ error: usernameResult.error })
  }
  const { display, normalized } = usernameResult

  if (typeof score !== 'number' || !Number.isInteger(score) || score <= 0) {
    return res.status(400).json({ error: 'Score must be a positive integer' })
  }
  if (score > SNAKE_MAX_SCORE) {
    return res.status(400).json({ error: `Score exceeds the maximum possible score of ${SNAKE_MAX_SCORE}` })
  }

  const turns = validateTurns(rawTurns)
  if (!turns) {
    return res.status(400).json({ error: 'Replay payload is invalid' })
  }

  const tokenPayload = parseRunToken(runToken)
  if (!tokenPayload) {
    return res.status(400).json({ error: 'Run token is invalid' })
  }

  const sql = getDb()
  await ensureRunSessionsTable(sql)
  await pruneExpiredRunSessions(sql)

  const sessionRows = await sql`
    SELECT nonce, seed, issued_at, expires_at, consumed_at
    FROM snake_leaderboard_run_sessions
    WHERE nonce = ${tokenPayload.nonce}
    LIMIT 1
  `
  if (sessionRows.length === 0) {
    return res.status(400).json({ error: 'Run session not found' })
  }

  const sessionRow = sessionRows[0]
  const storedIssuedAt = dateToMillis(sessionRow.issued_at)
  const storedExpiresAt = dateToMillis(sessionRow.expires_at)
  if (
    storedIssuedAt === null ||
    storedExpiresAt === null ||
    (sessionRow.seed as number) !== tokenPayload.seed ||
    storedIssuedAt !== tokenPayload.issuedAt ||
    storedExpiresAt !== tokenPayload.expiresAt
  ) {
    return res.status(400).json({ error: 'Run token does not match the stored session' })
  }

  if (sessionRow.consumed_at) {
    return res.status(409).json({ error: 'Run session has already been used' })
  }

  const now = Date.now()
  if (now > storedExpiresAt) {
    return res.status(422).json({ error: 'Run session expired. Start a new game and try again.' })
  }

  const simulation = simulateSnakeReplay(tokenPayload.seed, turns)
  if (simulation.reason === 'invalid-turn') {
    return res.status(400).json({ error: 'Replay failed validation' })
  }
  if (!simulation.ended || simulation.reason === 'tick-limit') {
    return res.status(400).json({ error: 'Replay did not reach a valid game-over state' })
  }
  if (simulation.score !== score) {
    return res.status(400).json({ error: 'Submitted score does not match the verified replay' })
  }

  const minimumElapsedMs = Math.max(0, simulation.ticks * SNAKE_TICK_MS - SNAKE_MIN_ELAPSED_SLACK_MS)
  if (now - storedIssuedAt < minimumElapsedMs) {
    return res.status(400).json({ error: 'Run completed faster than the game rules allow' })
  }

  const existing = await sql`
    SELECT 1 FROM snake_leaderboard_entries WHERE username_normalized = ${normalized} LIMIT 1
  `
  if (!adminOverride && existing.length > 0) {
    return res.status(409).json({ error: 'Username already taken' })
  }

  if (!adminOverride) {
    const topRows = await sql`
      SELECT score FROM snake_leaderboard_entries
      WHERE score > 0 AND score <= ${SNAKE_MAX_SCORE}
      ORDER BY score DESC, created_at ASC
      LIMIT 10
    `
    if (topRows.length >= 10) {
      const cutoff = topRows[9].score as number
      if (score <= cutoff) {
        return res.status(422).json({ error: 'That score no longer qualifies for the top 10' })
      }
    }
  }

  const consumeRows = await sql`
    UPDATE snake_leaderboard_run_sessions
    SET consumed_at = NOW(), consumed_username_normalized = ${normalized}
    WHERE nonce = ${tokenPayload.nonce} AND consumed_at IS NULL
    RETURNING nonce
  `
  if (consumeRows.length === 0) {
    return res.status(409).json({ error: 'Run session has already been used' })
  }

  if (adminOverride) {
    await sql`
      INSERT INTO snake_leaderboard_entries (username, username_normalized, score)
      VALUES (${display}, ${normalized}, ${score})
      ON CONFLICT (username_normalized)
      DO UPDATE SET username = EXCLUDED.username, score = EXCLUDED.score
    `
  } else {
    await sql`
      INSERT INTO snake_leaderboard_entries (username, username_normalized, score)
      VALUES (${display}, ${normalized}, ${score})
    `
  }

  return res.status(201).json({ success: true, verified: true, adminOverride })
}

// ---------- entry point ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      const body = (req.body ?? {}) as Partial<SnakeRunStartRequest | SnakeRunSubmitRequest>

      if (body.action === 'start') {
        return await handleStart(res)
      }

      if (body.action === 'submit') {
        return await handleSubmit(body as SnakeRunSubmitRequest, res)
      }

      return res.status(400).json({ error: 'Unknown snake leaderboard action' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('snake-leaderboard error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
