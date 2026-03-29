import fs from 'node:fs'

import { neon } from '@neondatabase/serverless'

function loadDatabaseUrl(envPath) {
  if (envPath) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      if (line.startsWith('DATABASE_URL=')) {
        return line
          .slice('DATABASE_URL='.length)
          .trim()
          .replace(/^"|"$/g, '')
          .replace(/\\n/g, '')
          .trim()
      }
    }
    throw new Error('DATABASE_URL missing from env file')
  }

  const direct = process.env.DATABASE_URL?.replace(/\\n/g, '').trim()
  if (!direct) {
    throw new Error('Provide DATABASE_URL in the environment or pass an env file path')
  }
  return direct
}

function normalize(name) {
  return name.toLowerCase()
}

const [, , action, maybeEnvPath, ...args] = process.argv
const envPath = maybeEnvPath && maybeEnvPath !== '-' ? maybeEnvPath : ''
const sql = neon(loadDatabaseUrl(envPath))

if (!action) {
  throw new Error('Usage: node scripts/snakeLeaderboardAdmin.mjs <action> [envPath|-] [args...]')
}

if (action === 'list-all') {
  const rows = await sql`
    SELECT username, username_normalized, score
    FROM snake_leaderboard_entries
    ORDER BY score DESC, created_at ASC
  `
  console.log(JSON.stringify(rows, null, 2))
  process.exit(0)
}

if (action === 'inspect') {
  const names = args
  if (names.length === 0) throw new Error('inspect requires at least one username')
  const rows = await sql`
    SELECT username, username_normalized, score
    FROM snake_leaderboard_entries
    WHERE username_normalized = ANY(${names.map(normalize)})
    ORDER BY score DESC, created_at ASC
  `
  console.log(JSON.stringify(rows, null, 2))
  process.exit(0)
}

if (action === 'rename') {
  const [fromName, toName] = args
  if (!fromName || !toName) throw new Error('rename requires <fromName> <toName>')
  const rows = await sql`
    UPDATE snake_leaderboard_entries
    SET username = ${toName}, username_normalized = ${normalize(toName)}
    WHERE username_normalized = ${normalize(fromName)}
    RETURNING username, username_normalized, score
  `
  console.log(JSON.stringify(rows, null, 2))
  process.exit(0)
}

if (action === 'delete') {
  const [name] = args
  if (!name) throw new Error('delete requires <name>')
  const rows = await sql`
    DELETE FROM snake_leaderboard_entries
    WHERE username_normalized = ${normalize(name)}
    RETURNING username, username_normalized, score
  `
  console.log(JSON.stringify(rows, null, 2))
  process.exit(0)
}

throw new Error(`Unknown action: ${action}`)
