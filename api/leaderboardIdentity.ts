export type LeaderboardDifficulty = 'easy' | 'medium' | 'hard'

export interface CanonicalIdentity {
  display: string
  normalized: string
}

export const LEADERBOARD_DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export const USERNAME_RE = /^[A-Za-z0-9_-]{3,16}$/

export const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'moderator', 'mod', 'system', 'root',
  'null', 'undefined', 'vercel', 'zain', 'joyce',
])

const PROFANITY = [
  'fuck', 'shit', 'ass', 'damn', 'bitch', 'dick', 'cock', 'pussy',
  'cunt', 'bastard', 'slut', 'whore', 'fag', 'nigger', 'nigga',
  'retard', 'rape', 'penis', 'vagina', 'anus', 'porn', 'cum',
  'nazi', 'hitler', 'kill', 'die',
  'kosom', 'kossom', 'kosomak', 'kosomk', 'kosomik',
  'khawal', 'khwl', '5awal', '5wl',
  'metnak', 'metnaka', 'mtnak', 'mtnaka',
  'bez', 'bezaz', 'bzaz',
] as const

export const OVERRIDE_CODES: Record<string, CanonicalIdentity> = {
  '71594250': { display: 'zain', normalized: 'zain' },
  '48273196': { display: 'joyce', normalized: 'joyce' },
}

export function isOverrideCode(raw: string): boolean {
  return Object.prototype.hasOwnProperty.call(OVERRIDE_CODES, raw.trim())
}

export function isLeaderboardDifficulty(value: unknown): value is LeaderboardDifficulty {
  return typeof value === 'string' && LEADERBOARD_DIFFICULTIES.includes(value as LeaderboardDifficulty)
}

export function canonicalizeIdentity(raw: string): CanonicalIdentity {
  const trimmed = raw.trim()
  const override = OVERRIDE_CODES[trimmed]
  if (override) return override

  return {
    display: trimmed,
    normalized: trimmed.toLowerCase(),
  }
}

export function isProfane(name: string): boolean {
  const lower = name.toLowerCase()
  return PROFANITY.some((word) => lower.includes(word))
}

export function validateLeaderboardName(
  raw: string,
): { ok: true; name: string; normalized: string } | { ok: false; error: string } {
  const name = raw.trim()
  if (!name) return { ok: false, error: 'Name cannot be empty' }

  const override = OVERRIDE_CODES[name]
  if (override) {
    return { ok: true, name: override.display, normalized: override.normalized }
  }

  if (!USERNAME_RE.test(name)) {
    return {
      ok: false,
      error: 'Name must be 3-16 characters. Letters, numbers, _ and - allowed.',
    }
  }

  const identity = canonicalizeIdentity(name)
  if (RESERVED_USERNAMES.has(identity.normalized)) {
    return { ok: false, error: 'That name is not allowed' }
  }
  if (isProfane(identity.normalized)) {
    return { ok: false, error: 'That name is not allowed' }
  }

  return { ok: true, name: identity.display, normalized: identity.normalized }
}

export function isBetterDescending(candidate: number, current: number): boolean {
  return candidate > current
}

export function isBetterAscending(candidate: number, current: number): boolean {
  return candidate < current
}
