import type { SnakeRunSession } from './snakeAntiCheat'

const API_URL = '/api/snake-leaderboard'

interface ApiErrorPayload {
  error?: string
}

let primedSession: SnakeRunSession | null = null
let primedSessionPromise: Promise<SnakeRunSession> | null = null

async function readApiPayload<T>(res: Response): Promise<T | ApiErrorPayload> {
  const text = await res.text()
  if (!text) return {}

  try {
    return JSON.parse(text) as T | ApiErrorPayload
  } catch {
    return { error: text }
  }
}

async function fetchSnakeRunSession(): Promise<SnakeRunSession> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'start' }),
  })
  const data = await readApiPayload<SnakeRunSession>(res)
  if (!res.ok) {
    throw new Error(('error' in data && data.error) || 'Unable to start verified run')
  }
  return data as SnakeRunSession
}

export function primeSnakeRunSession(forceFresh = false): Promise<SnakeRunSession> {
  if (forceFresh) {
    primedSession = null
    primedSessionPromise = null
  }

  if (primedSession) {
    return Promise.resolve(primedSession)
  }

  if (primedSessionPromise) {
    return primedSessionPromise
  }

  primedSessionPromise = fetchSnakeRunSession()
    .then((session) => {
      primedSession = session
      primedSessionPromise = null
      return session
    })
    .catch((error) => {
      primedSessionPromise = null
      throw error
    })

  return primedSessionPromise
}

export async function takeSnakeRunSession(forceFresh = false): Promise<SnakeRunSession> {
  const session = forceFresh
    ? await primeSnakeRunSession(true)
    : primedSession ?? await primeSnakeRunSession()

  primedSession = null

  // Keep the next run warm in the background so opening/restarting Snake feels instant.
  void primeSnakeRunSession().catch(() => {})

  return session
}
